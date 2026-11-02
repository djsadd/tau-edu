import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, degrees, programs } from "@/db/schema";
import { LOCALES } from "@/i18n/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createService, startService } from "../shared/server";

const app = createService("admissions");

const uuidOrEmpty = z.union([z.literal(""), z.uuid()]).optional();

const schema = z.object({
  fullName: z.string().trim().min(3).max(200),
  phone: z.string().trim().max(30).refine((v) => v.replace(/\D/g, "").length >= 10),
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  degreeId: uuidOrEmpty,
  programId: uuidOrEmpty,
  message: z.string().trim().max(2000).optional(),
  consent: z.literal(true),
  website: z.string().optional(),
  locale: z.enum(LOCALES),
});

app.post("/api/apply", async (c) => {
  if (!rateLimit(`apply:${clientIp(c.req.raw.headers)}`, 5, 10 * 60 * 1000)) {
    return c.json({ error: "rate_limited" }, 429);
  }
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid" }, 400);
  const data = parsed.data;

  // Бот заполнил скрытое поле: отвечаем успехом, но ничего не сохраняем.
  if (data.website) return c.json({ ok: true });

  // Ссылки принимаем, только если такие опубликованные записи существуют.
  const [program] = data.programId
    ? await db.select({ id: programs.id, degreeId: programs.degreeId }).from(programs).where(and(eq(programs.id, data.programId), eq(programs.published, true)))
    : [];
  const [degree] = data.degreeId
    ? await db.select({ id: degrees.id }).from(degrees).where(and(eq(degrees.id, data.degreeId), eq(degrees.published, true)))
    : [];

  await db.insert(applications).values({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || null,
    degreeId: program?.degreeId ?? degree?.id ?? null,
    programId: program?.id ?? null,
    message: data.message || null,
    locale: data.locale,
    consentAt: new Date(),
  });
  return c.json({ ok: true }, 201);
});

/* ---------- Для панели управления ---------- */

const STATUSES = ["NEW", "IN_PROGRESS", "ENROLLED", "DECLINED"] as const;

const listQuery = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

app.get("/internal/applications", async (c) => {
  const parsed = listQuery.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: "invalid" }, 400);
  const { status, page, limit } = parsed.data;
  const where = status ? eq(applications.status, status) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ application: applications, program: programs.name, degree: degrees.name })
      .from(applications)
      .leftJoin(programs, eq(applications.programId, programs.id))
      .leftJoin(degrees, eq(applications.degreeId, degrees.id))
      .where(where)
      .orderBy(desc(applications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(applications).where(where),
  ]);
  return c.json({ rows, total });
});

app.get("/internal/stats", async (c) => {
  const [{ total }] = await db.select({ total: count() }).from(applications).where(eq(applications.status, "NEW"));
  return c.json({ new: total });
});

const updateBody = z.object({ status: z.enum(STATUSES), notes: z.string().max(5000).nullable() });

app.patch("/internal/applications/:id", async (c) => {
  const id = z.uuid().safeParse(c.req.param("id"));
  const body = updateBody.safeParse(await c.req.json().catch(() => null));
  if (!id.success || !body.success) return c.json({ error: "Некорректные данные" }, 400);
  await db.update(applications).set(body.data).where(eq(applications.id, id.data));
  return c.json({ ok: true });
});

app.delete("/internal/applications/:id", async (c) => {
  const id = z.uuid().safeParse(c.req.param("id"));
  if (!id.success) return c.json({ error: "Некорректные данные" }, 400);
  await db.delete(applications).where(eq(applications.id, id.data));
  return c.json({ ok: true });
});

startService(app, "admissions", 4004);
