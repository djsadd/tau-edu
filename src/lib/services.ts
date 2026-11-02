import "server-only";
import type { applications, Localized, mediaFiles, mediaFolders } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import type { SearchEntity, SearchHit } from "../../services/search/engine";

export type { SearchEntity, SearchHit };

/** Ответ сервиса приходит в JSON, поэтому даты в нём уже строки. */
type Json<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] };
type Application = Json<typeof applications.$inferSelect>;
type MediaFolder = Json<typeof mediaFolders.$inferSelect>;
type MediaFile = Json<typeof mediaFiles.$inferSelect>;

/** Сообщение можно показать сотруднику: ответ сервиса или понятная замена, если сервис недоступен. */
export class ServiceError extends Error {}

const URLS = {
  search: () => process.env.SEARCH_URL || "http://localhost:4001",
  files: () => process.env.FILES_URL || "http://localhost:4003",
  admissions: () => process.env.ADMISSIONS_URL || "http://localhost:4004",
};

async function call<T>(service: keyof typeof URLS, path: string, options: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${URLS[service]()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_TOKEN}`,
        ...(options.body !== undefined && { "Content-Type": "application/json" }),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });
  } catch (error) {
    console.error(`Сервис ${service} недоступен: ${path}`, error);
    throw new ServiceError(`Сервис «${service}» временно недоступен. Повторите позже.`);
  }
  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok) {
    // Ошибки 5xx описывают внутренности сервиса, сотруднику они не нужны.
    throw new ServiceError(response.status < 500 && data?.error ? data.error : `Сервис «${service}» вернул ошибку. Повторите позже.`);
  }
  return data as T;
}

/* ---------- Поиск ---------- */

export async function searchSite(q: string, locale: Locale, { limit = 30 }: { limit?: number } = {}) {
  const params = new URLSearchParams({ q, locale, limit: String(limit) });
  return (await call<{ hits: SearchHit[] }>("search", `/internal/search?${params}`)).hits;
}

export async function indexedUrls() {
  return (await call<{ urls: string[] }>("search", "/internal/urls")).urls;
}

/** Запись уже сохранена, поэтому сбой индекса не отменяет сохранение: сервис поиска догонит её плановой переиндексацией. */
export async function reindexEntity(type: SearchEntity, id: string) {
  await call("search", "/internal/reindex", { method: "POST", body: { type, id } }).catch((error) => {
    console.error(`Индекс не обновлён: ${type} ${id}`, error);
  });
}

export async function reindexAll() {
  await call("search", "/internal/reindex", { method: "POST", body: { all: true }, timeoutMs: 120_000 });
}

/* ---------- Заявки ---------- */

export type ApplicationStatus = Application["status"];
export type ApplicationRow = { application: Application; program: Localized | null; degree: Localized | null };

export function listApplications(query: { status?: ApplicationStatus; page?: number; limit: number }) {
  const params = new URLSearchParams({ limit: String(query.limit), page: String(query.page ?? 1), ...(query.status && { status: query.status }) });
  return call<{ rows: ApplicationRow[]; total: number }>("admissions", `/internal/applications?${params}`);
}

/** Панель должна открываться и без сервиса заявок, поэтому счётчик необязателен. */
export function newApplicationsCount() {
  return call<{ new: number }>("admissions", "/internal/stats").then((r) => r.new, () => null);
}

export function updateApplicationStatus(id: string, status: ApplicationStatus, notes: string | null) {
  return call("admissions", `/internal/applications/${id}`, { method: "PATCH", body: { status, notes } });
}

export function removeApplication(id: string) {
  return call("admissions", `/internal/applications/${id}`, { method: "DELETE" });
}

/* ---------- Файлы ---------- */

export function filesCount() {
  return call<{ files: number }>("files", "/internal/stats").then((r) => r.files, () => null);
}

export function browseFiles(folder: string | null) {
  const query = folder ? `?${new URLSearchParams({ folder })}` : "";
  return call<{ folders: MediaFolder[]; files: MediaFile[]; currentId: string | null }>("files", `/internal/browse${query}`);
}

export async function listedFolders(parentId: string | null) {
  const query = parentId ? `?${new URLSearchParams({ parent: parentId })}` : "";
  return (await call<{ folders: MediaFolder[] }>("files", `/internal/listed${query}`)).folders;
}

export function listedFolder(id: string) {
  return call<{ folder: MediaFolder | null; files: MediaFile[] }>("files", `/internal/listed/${id}`);
}

export function createMediaFolder(name: string, parentId: string | null) {
  return call("files", "/internal/folders", { method: "POST", body: { name, parentId } });
}

export function updateMediaFolder(id: string, changes: { name?: string; isPublic?: boolean; listed?: boolean }) {
  return call("files", `/internal/folders/${id}`, { method: "PATCH", body: changes });
}

export function removeMediaFolder(id: string) {
  return call("files", `/internal/folders/${id}`, { method: "DELETE" });
}

export function updateMediaFile(id: string, changes: { name?: string; title?: Localized; folderId?: string | null }) {
  return call("files", `/internal/files/${id}`, { method: "PATCH", body: changes });
}

export function removeMediaFile(id: string) {
  return call("files", `/internal/files/${id}`, { method: "DELETE" });
}
