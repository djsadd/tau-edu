"use server";

import bcrypt from "bcryptjs";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { appointments, menuItems, siteSettings, users, type Localized } from "@/db/schema";
import { createSession, destroySession, getSessionUser, requireAdmin, requireUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SECTIONS } from "@/lib/sections";
import {
  createMediaFolder, reindexAll, reindexEntity, removeApplication, removeMediaFile, removeMediaFolder, ServiceError,
  updateApplicationStatus, updateMediaFile, updateMediaFolder,
} from "@/lib/services";
import { isUuid } from "@/lib/text";
import type { ActionResult, AppointmentDraft } from "./fields";
import { dbErrorMessage, FormError, parseFields } from "./form-data";
import { getResource, SETTINGS_FIELDS } from "./resources";

const fail = (error: string): ActionResult => ({ error });

function handle(error: unknown): ActionResult {
  if (error instanceof FormError || error instanceof ServiceError) return fail(error.message);
  const message = dbErrorMessage(error);
  if (message) return fail(message);
  throw error;
}

function refreshSite() {
  revalidatePath("/", "layout");
}

/* ---------- Вход ---------- */

export async function login(_: ActionResult, form: FormData): Promise<ActionResult> {
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) return fail("Слишком много попыток. Повторите через 15 минут.");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = await db.select().from(users).where(eq(users.email, email));
  // Хэш проверяется и для несуществующего адреса, чтобы время ответа его не выдавало.
  const hash = user?.passwordHash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7cD1mBvVxNnAFRJhnKYVJ6fJz6Xc1eK";
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) return fail("Неверная почта или пароль");
  await createSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- Универсальный CRUD ---------- */

const appointmentSchema = z.object({
  kind: z.enum(["LEADERSHIP", "DEAN", "TEACHER", "SPECIALIST"]),
  position: z.object({ kk: z.string().optional(), ru: z.string().optional(), en: z.string().optional() }),
  facultyId: z.string(),
  departmentId: z.string(),
  officeId: z.string(),
  isHead: z.boolean(),
});

function parseAppointments(form: FormData) {
  const raw = String(form.get("appointments") ?? "[]");
  const parsed = z.array(appointmentSchema).safeParse(JSON.parse(raw));
  if (!parsed.success) throw new FormError("Некорректные данные о должностях");
  return parsed.data.map((row: AppointmentDraft, index) => {
    const need = (id: string, label: string) => {
      if (!isUuid(id)) throw new FormError(`Выберите ${label} для должности №${index + 1}`);
      return id;
    };
    const position: Localized = {};
    for (const [locale, text] of Object.entries(row.position)) {
      if (text?.trim()) position[locale as keyof Localized] = text.trim();
    }
    return {
      kind: row.kind,
      position,
      isHead: row.isHead,
      sortOrder: index,
      facultyId: row.kind === "DEAN" ? need(row.facultyId, "факультет") : null,
      departmentId: row.kind === "TEACHER" ? need(row.departmentId, "кафедру") : null,
      officeId: row.kind === "SPECIALIST" ? need(row.officeId, "отдел") : null,
    };
  });
}

export async function saveResource(key: string, id: string | null, _: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const resource = getResource(key);
  if (!resource) return fail("Неизвестный раздел");
  if (id && !isUuid(id)) return fail("Некорректный идентификатор");

  let savedId = id;
  try {
    const values = parseFields(resource.fields, form);
    if (key === "offices" && id && values.parentId === id) throw new FormError("Подразделение не может входить само в себя");
    const rows = key === "persons" ? parseAppointments(form) : null;
    const table = resource.table as PgTable & { id: PgColumn };

    await db.transaction(async (tx) => {
      if (id) {
        await tx.update(table).set(values).where(eq(table.id, id));
      } else {
        const [created] = await tx.insert(table).values(values).returning({ id: table.id });
        savedId = created.id as string;
      }
      if (rows) {
        await tx.delete(appointments).where(eq(appointments.personId, savedId!));
        if (rows.length) await tx.insert(appointments).values(rows.map((r) => ({ ...r, personId: savedId! })));
      }
    });
    await reindexEntity(resource.key, savedId!);
  } catch (error) {
    return handle(error);
  }
  refreshSite();
  redirect(`/admin/r/${key}?saved=1`);
}

export async function deleteResource(key: string, id: string): Promise<ActionResult> {
  await requireUser();
  const resource = getResource(key);
  if (!resource || !isUuid(id)) return fail("Запись не найдена");
  const table = resource.table as PgTable & { id: PgColumn };
  try {
    await db.delete(table).where(eq(table.id, id));
    await reindexEntity(resource.key, id);
  } catch (error) {
    return handle(error);
  }
  refreshSite();
  return { ok: true };
}

export async function runReindex(): Promise<ActionResult> {
  await requireAdmin();
  try {
    await reindexAll();
  } catch (error) {
    return handle(error);
  }
  return { ok: true, message: "Поисковый индекс обновлён" };
}

/* ---------- Настройки ---------- */

export async function saveSettings(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const value = parseFields(SETTINGS_FIELDS, form);
    await db
      .insert(siteSettings)
      .values({ key: "site", value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  } catch (error) {
    return handle(error);
  }
  refreshSite();
  return { ok: true, message: "Настройки сохранены" };
}

/* ---------- Заявки ---------- */

const STATUSES = ["NEW", "IN_PROGRESS", "ENROLLED", "DECLINED"] as const;

export async function updateApplication(id: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const status = STATUSES.find((s) => s === form.get("status"));
  if (!isUuid(id) || !status) return fail("Некорректные данные");
  try {
    await updateApplicationStatus(id, status, String(form.get("notes") ?? "").trim() || null);
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/admin/applications");
  return { ok: true, message: "Сохранено" };
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(id)) return fail("Некорректные данные");
  try {
    await removeApplication(id);
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/admin/applications");
  return { ok: true };
}

/* ---------- Меню ---------- */

export async function saveMenuItem(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireUser();
  const id = String(form.get("id") ?? "");
  const kind = z.enum(["GROUP", "SECTION", "PAGE", "URL"]).safeParse(form.get("kind"));
  const location = z.enum(["HEADER", "FOOTER"]).safeParse(form.get("location"));
  if (!kind.success || !location.success) return fail("Некорректные данные");

  const label: Localized = {};
  for (const l of ["kk", "ru", "en"] as const) {
    const text = String(form.get(`label.${l}`) ?? "").trim();
    if (text) label[l] = text;
  }
  const sectionKey = String(form.get("sectionKey") ?? "");
  const pageId = String(form.get("pageId") ?? "");
  const url = String(form.get("url") ?? "").trim();
  const parentId = String(form.get("parentId") ?? "");

  if (kind.data === "SECTION" && !(sectionKey in SECTIONS)) return fail("Выберите раздел");
  if (kind.data === "PAGE" && !isUuid(pageId)) return fail("Выберите страницу");
  if (kind.data === "URL" && !/^(https?:\/\/|\/(?!\/))/i.test(url)) return fail("Ссылка должна начинаться с http://, https:// или /");
  if (kind.data !== "SECTION" && !Object.keys(label).length) return fail("Укажите название пункта хотя бы на одном языке");
  if (parentId && (!isUuid(parentId) || parentId === id)) return fail("Некорректный родительский пункт");

  const values = {
    kind: kind.data,
    location: location.data,
    label,
    parentId: parentId || null,
    sectionKey: kind.data === "SECTION" ? sectionKey : null,
    pageId: kind.data === "PAGE" ? pageId : null,
    url: kind.data === "URL" ? url : null,
    openInNewTab: form.get("openInNewTab") === "on",
    visible: form.get("visible") === "on",
  };

  try {
    if (id) {
      if (!isUuid(id)) return fail("Некорректный идентификатор");
      await db.update(menuItems).set(values).where(eq(menuItems.id, id));
    } else {
      const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${menuItems.sortOrder}), 0)` }).from(menuItems);
      await db.insert(menuItems).values({ ...values, sortOrder: Number(max) + 1 });
    }
  } catch (error) {
    return handle(error);
  }
  refreshSite();
  return { ok: true, message: "Пункт меню сохранён" };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  await requireUser();
  if (!isUuid(id)) return fail("Некорректный идентификатор");
  await db.delete(menuItems).where(eq(menuItems.id, id));
  refreshSite();
  return { ok: true };
}

/** Меняет местами пункт с соседом на том же уровне. */
export async function moveMenuItem(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireUser();
  if (!isUuid(id)) return fail("Некорректный идентификатор");
  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!item) return fail("Пункт не найден");
  const siblings = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.location, item.location), item.parentId ? eq(menuItems.parentId, item.parentId) : isNull(menuItems.parentId)))
    .orderBy(asc(menuItems.sortOrder));
  const index = siblings.findIndex((s) => s.id === id);
  const other = siblings[direction === "up" ? index - 1 : index + 1];
  if (!other) return { ok: true };
  // При одинаковых значениях обмен ничего бы не изменил, поэтому порядок нумеруется заново.
  const reordered = siblings.map((s) => s.id);
  reordered[index] = other.id;
  reordered[siblings.indexOf(other)] = id;
  await db.transaction(async (tx) => {
    for (const [i, rowId] of reordered.entries()) {
      await tx.update(menuItems).set({ sortOrder: i + 1 }).where(eq(menuItems.id, rowId));
    }
  });
  refreshSite();
  return { ok: true };
}

/* ---------- Файлы ---------- */

/** Права проверяются здесь, а данные меняет сервис файлов. */
async function filesAction(action: () => Promise<unknown>, { site = false } = {}): Promise<ActionResult> {
  try {
    await action();
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/admin/files");
  if (site) refreshSite();
  return { ok: true };
}

export async function createFolder(name: string, parentId: string | null): Promise<ActionResult> {
  await requireUser();
  const clean = name.trim().slice(0, 120);
  if (!clean) return fail("Укажите название папки");
  if (parentId && !isUuid(parentId)) return fail("Некорректная папка");
  return filesAction(() => createMediaFolder(clean, parentId));
}

export async function renameFolder(id: string, name: string): Promise<ActionResult> {
  await requireUser();
  const clean = name.trim().slice(0, 120);
  if (!isUuid(id) || !clean) return fail("Укажите название папки");
  return filesAction(() => updateMediaFolder(id, { name: clean }));
}

export async function setFolderFlags(id: string, flags: { isPublic?: boolean; listed?: boolean }): Promise<ActionResult> {
  await requireUser();
  if (!isUuid(id)) return fail("Некорректная папка");
  return filesAction(() => updateMediaFolder(id, flags), { site: true });
}

export async function deleteFolder(id: string): Promise<ActionResult> {
  await requireUser();
  if (!isUuid(id)) return fail("Некорректная папка");
  return filesAction(() => removeMediaFolder(id));
}

export async function renameFile(id: string, name: string, title: Localized): Promise<ActionResult> {
  await requireUser();
  const clean = name.trim().slice(0, 200);
  if (!isUuid(id) || !clean) return fail("Укажите имя файла");
  return filesAction(() => updateMediaFile(id, { name: clean, title }), { site: true });
}

export async function moveFile(id: string, folderId: string | null): Promise<ActionResult> {
  await requireUser();
  if (!isUuid(id) || (folderId && !isUuid(folderId))) return fail("Некорректные данные");
  return filesAction(() => updateMediaFile(id, { folderId }));
}

export async function deleteFile(id: string): Promise<ActionResult> {
  await requireUser();
  if (!isUuid(id)) return fail("Некорректный файл");
  return filesAction(() => removeMediaFile(id), { site: true });
}

/* ---------- Пользователи ---------- */

export async function createUser(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      email: z.email().transform((v) => v.toLowerCase()),
      password: z.string().min(10),
      role: z.enum(["ADMIN", "EDITOR"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Проверьте поля: имя, почта и пароль не короче 10 символов");
  const { password, ...data } = parsed.data;
  try {
    await db.insert(users).values({ ...data, passwordHash: await bcrypt.hash(password, 12) });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/admin/users");
  return { ok: true, message: "Пользователь создан" };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const me = await requireAdmin();
  if (!isUuid(id) || id === me.id) return fail("Нельзя удалить собственную учётную запись");
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function changeOwnPassword(_: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return fail("Сессия истекла");
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return fail("Пароль не короче 10 символов");
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 12) }).where(eq(users.id, user.id));
  return { ok: true, message: "Пароль изменён" };
}

