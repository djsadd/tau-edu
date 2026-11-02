import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { DEFAULT_LOCALE, isLocale, LOCALES } from "@/i18n/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createService, startService } from "../shared/server";
import { reindexAll, reindexEntity, searchSite, type SearchEntity } from "./engine";

const REINDEX_INTERVAL_MS = (Number(process.env.REINDEX_INTERVAL_MINUTES) || 10) * 60 * 1000;

const ENTITIES = ["news", "events", "faculties", "departments", "programs", "degrees", "offices", "persons", "studentOrgs", "pages"] as const satisfies readonly SearchEntity[];

const app = createService("search");

app.get("/api/search", async (c) => {
  if (!rateLimit(`search:${clientIp(c.req.raw.headers)}`, 120, 60 * 1000)) return c.json({ hits: [] }, 429);
  const locale = c.req.query("locale") ?? "";
  const hits = await searchSite(c.req.query("q") ?? "", isLocale(locale) ? locale : DEFAULT_LOCALE, { limit: 8 });
  return c.json({ hits: hits.map(({ entityType, title, summary, url }) => ({ entityType, title, summary, url })) });
});

const internalQuery = z.object({
  q: z.string().default(""),
  locale: z.enum(LOCALES),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  mode: z.enum(["all", "any"]).default("all"),
});

app.get("/internal/search", async (c) => {
  const parsed = internalQuery.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: "invalid" }, 400);
  const { q, locale, limit, mode } = parsed.data;
  return c.json({ hits: await searchSite(q, locale, { limit, mode }) });
});

/** Для sitemap: индекс содержит ровно все опубликованные адреса. */
app.get("/internal/urls", async (c) => {
  const { rows } = await db.execute(sql`SELECT DISTINCT url FROM search_documents`);
  return c.json({ urls: rows.map((r) => r.url as string) });
});

const reindexBody = z.object({ type: z.enum(ENTITIES), id: z.uuid() }).or(z.object({ all: z.literal(true) }));

app.post("/internal/reindex", async (c) => {
  const parsed = reindexBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid" }, 400);
  if ("all" in parsed.data) await reindexAll();
  else await reindexEntity(parsed.data.type, parsed.data.id);
  return c.json({ ok: true });
});

/** Если сервис был недоступен, когда редактор сохранял запись, индекс догонит её при старте и по таймеру. */
const catchUp = () => reindexAll().catch((error) => console.error("[search] плановая переиндексация", error));
void catchUp();
const timer = setInterval(catchUp, REINDEX_INTERVAL_MS);

startService(app, "search", 4001, () => clearInterval(timer));
