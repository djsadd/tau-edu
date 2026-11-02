import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { db } from "@/db";
import { mediaFiles, mediaFolders, users } from "@/db/schema";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { isUuid } from "@/lib/text";
import { createService, startService } from "../shared/server";
import { detectMime, isInlineMime, MAX_UPLOAD_BYTES, objectStream, removeObject, writeObject } from "./storage";

const app = createService("files");

/** Токен могли выдать давно: пользователь должен существовать прямо сейчас. */
async function sessionUserId(token: string | undefined) {
  const id = await verifySession(token);
  if (!id) return null;
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  return user?.id ?? null;
}

/* ---------- Выдача файлов ---------- */

app.get("/files/:id", async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) return c.text("Not found", 404);

  const [row] = await db
    .select({ file: mediaFiles, isPublic: mediaFolders.isPublic })
    .from(mediaFiles)
    .leftJoin(mediaFolders, eq(mediaFiles.folderId, mediaFolders.id))
    .where(eq(mediaFiles.id, id));
  if (!row) return c.text("Not found", 404);

  // Файлы вне папок считаются публичными: это картинки для страниц сайта.
  const isPublic = row.isPublic ?? true;
  if (!isPublic && !(await sessionUserId(getCookie(c, SESSION_COOKIE)))) return c.text("Not found", 404);

  const disposition = c.req.query("download") !== undefined || !isInlineMime(row.file.mime) ? "attachment" : "inline";

  return new Response(objectStream(row.file.storageKey), {
    headers: {
      "Content-Type": row.file.mime,
      "Content-Length": String(row.file.size),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(row.file.name)}`,
      "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
});

/* ---------- Загрузка и выбор файлов из браузера сотрудника ---------- */

app.get("/api/admin/files", async (c) => {
  if (!(await sessionUserId(getCookie(c, SESSION_COOKIE)))) return c.json({ error: "unauthorized" }, 401);
  const raw = c.req.query("folder");
  const folderId = isUuid(raw) ? raw : null;
  const all = await db.select({ id: mediaFolders.id, name: mediaFolders.name, parentId: mediaFolders.parentId }).from(mediaFolders).orderBy(asc(mediaFolders.name));
  const path: { id: string; name: string }[] = [];
  for (let node = all.find((f) => f.id === folderId); node; node = all.find((f) => f.id === node!.parentId)) {
    path.unshift({ id: node.id, name: node.name });
  }
  const files = await db
    .select({ id: mediaFiles.id, name: mediaFiles.name, mime: mediaFiles.mime, size: mediaFiles.size })
    .from(mediaFiles)
    .where(folderId ? eq(mediaFiles.folderId, folderId) : isNull(mediaFiles.folderId))
    .orderBy(asc(mediaFiles.name));
  return c.json({
    path,
    folders: all.filter((f) => f.parentId === folderId).map(({ id, name }) => ({ id, name })),
    files: c.req.query("images") !== undefined ? files.filter((f) => f.mime.startsWith("image/") && f.mime !== "image/svg+xml") : files,
  });
});

app.post("/api/admin/files", async (c) => {
  const userId = await sessionUserId(getCookie(c, SESSION_COOKIE));
  if (!userId) return c.json({ error: "Сессия истекла" }, 401);

  const form = await c.req.raw.formData().catch(() => null);
  if (!form) return c.json({ error: "Некорректный запрос" }, 400);
  const folderId = form.get("folderId");
  if (folderId && !isUuid(folderId)) return c.json({ error: "Некорректная папка" }, 400);

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return c.json({ error: "Файлы не выбраны" }, 400);

  // Сначала проверяем всё, чтобы не сохранить пачку наполовину.
  const prepared = files.map((file) => ({ file, type: detectMime(file.name) }));
  const rejected = prepared.find((p) => !p.type);
  if (rejected) return c.json({ error: `Тип файла не разрешён: ${rejected.file.name}` }, 415);
  const large = files.find((f) => f.size > MAX_UPLOAD_BYTES);
  if (large) return c.json({ error: `Файл больше 50 МБ: ${large.name}` }, 413);

  const created = [];
  for (const { file, type } of prepared) {
    const storageKey = await writeObject(type!.ext, new Uint8Array(await file.arrayBuffer()));
    const [row] = await db
      .insert(mediaFiles)
      .values({ name: file.name.slice(0, 200), storageKey, mime: type!.mime, size: file.size, folderId: (folderId as string) || null, uploadedById: userId })
      .returning({ id: mediaFiles.id, name: mediaFiles.name, mime: mediaFiles.mime, size: mediaFiles.size });
    created.push(row);
  }
  return c.json({ files: created }, 201);
});

/* ---------- Для сервера сайта: каталог, раздел «Документы» и управление из панели ---------- */

app.get("/internal/stats", async (c) => {
  const [{ total }] = await db.select({ total: count() }).from(mediaFiles);
  return c.json({ files: total });
});

app.get("/internal/browse", async (c) => {
  const raw = c.req.query("folder");
  const folderId = isUuid(raw) ? raw : null;
  const folders = await db.select().from(mediaFolders).orderBy(asc(mediaFolders.name));
  const current = folderId ? folders.find((f) => f.id === folderId) ?? null : null;
  const files = await db
    .select()
    .from(mediaFiles)
    .where(current ? eq(mediaFiles.folderId, current.id) : isNull(mediaFiles.folderId))
    .orderBy(asc(mediaFiles.name));
  return c.json({ folders, files, currentId: current?.id ?? null });
});

app.get("/internal/listed", async (c) => {
  const parent = c.req.query("parent");
  const rows = await db
    .select()
    .from(mediaFolders)
    .where(
      and(
        eq(mediaFolders.isPublic, true),
        eq(mediaFolders.listed, true),
        isUuid(parent) ? eq(mediaFolders.parentId, parent) : isNull(mediaFolders.parentId),
      ),
    )
    .orderBy(asc(mediaFolders.name));
  return c.json({ folders: rows });
});

app.get("/internal/listed/:id", async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) return c.json({ folder: null, files: [] });
  const [folder] = await db
    .select()
    .from(mediaFolders)
    .where(and(eq(mediaFolders.id, id), eq(mediaFolders.isPublic, true), eq(mediaFolders.listed, true)));
  if (!folder) return c.json({ folder: null, files: [] });
  const files = await db.select().from(mediaFiles).where(eq(mediaFiles.folderId, id)).orderBy(asc(mediaFiles.name));
  return c.json({ folder, files });
});

async function descendantFolderIds(rootId: string) {
  const all = await db.select({ id: mediaFolders.id, parentId: mediaFolders.parentId }).from(mediaFolders);
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const folder of all) if (folder.parentId === ids[i]) ids.push(folder.id);
  }
  return ids;
}

const createFolderBody = z.object({ name: z.string().trim().min(1).max(120), parentId: z.uuid().nullable() });

app.post("/internal/folders", async (c) => {
  const body = createFolderBody.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Некорректная папка" }, 400);
  const { name, parentId } = body.data;
  let isPublic = true;
  let listed = false;
  if (parentId) {
    const [parent] = await db.select().from(mediaFolders).where(eq(mediaFolders.id, parentId));
    if (!parent) return c.json({ error: "Папка не найдена" }, 404);
    // Вложенная папка наследует доступ родителя.
    isPublic = parent.isPublic;
    listed = parent.listed;
  }
  await db.insert(mediaFolders).values({ name, parentId, isPublic, listed });
  return c.json({ ok: true }, 201);
});

const updateFolderBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  isPublic: z.boolean().optional(),
  listed: z.boolean().optional(),
});

app.patch("/internal/folders/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateFolderBody.safeParse(await c.req.json().catch(() => null));
  if (!isUuid(id) || !body.success) return c.json({ error: "Некорректная папка" }, 400);
  const { name, isPublic, listed } = body.data;
  if (name) await db.update(mediaFolders).set({ name }).where(eq(mediaFolders.id, id));
  if (isPublic !== undefined || listed !== undefined) {
    const next: { isPublic?: boolean; listed?: boolean } = { isPublic, listed };
    // Приватная папка не может быть видна в публичном разделе «Документы».
    if (isPublic === false) next.listed = false;
    if (listed === true) next.isPublic = true;
    await db.update(mediaFolders).set(next).where(inArray(mediaFolders.id, await descendantFolderIds(id)));
  }
  return c.json({ ok: true });
});

app.delete("/internal/folders/:id", async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) return c.json({ error: "Некорректная папка" }, 400);
  const [hasFiles] = await db.select({ id: mediaFiles.id }).from(mediaFiles).where(eq(mediaFiles.folderId, id)).limit(1);
  const [hasFolders] = await db.select({ id: mediaFolders.id }).from(mediaFolders).where(eq(mediaFolders.parentId, id)).limit(1);
  if (hasFiles || hasFolders) return c.json({ error: "Папка не пуста. Сначала удалите или переместите её содержимое." }, 409);
  await db.delete(mediaFolders).where(eq(mediaFolders.id, id));
  return c.json({ ok: true });
});

const updateFileBody = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  title: z.object({ kk: z.string().optional(), ru: z.string().optional(), en: z.string().optional() }).optional(),
  folderId: z.uuid().nullable().optional(),
});

app.patch("/internal/files/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateFileBody.safeParse(await c.req.json().catch(() => null));
  if (!isUuid(id) || !body.success) return c.json({ error: "Некорректные данные" }, 400);
  await db.update(mediaFiles).set(body.data).where(eq(mediaFiles.id, id));
  return c.json({ ok: true });
});

app.delete("/internal/files/:id", async (c) => {
  const id = c.req.param("id");
  if (!isUuid(id)) return c.json({ error: "Некорректный файл" }, 400);
  const [file] = await db.delete(mediaFiles).where(eq(mediaFiles.id, id)).returning();
  if (file) await removeObject(file.storageKey);
  return c.json({ ok: true });
});

startService(app, "files", 4003);
