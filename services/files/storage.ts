import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif",
  svg: "image/svg+xml",
  pdf: "application/pdf", txt: "text/plain", csv: "text/csv", rtf: "application/rtf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  zip: "application/zip", mp4: "video/mp4", mp3: "audio/mpeg",
};

/** Только эти типы браузер показывает прямо на сайте. SVG и HTML могут содержать скрипты. */
const INLINE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf", "video/mp4", "audio/mpeg"]);

function root() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./data/uploads");
}

export function detectMime(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED[ext] ? { ext, mime: ALLOWED[ext] } : null;
}

export function isInlineMime(mime: string) {
  return INLINE.has(mime);
}

export async function writeObject(ext: string, bytes: Uint8Array) {
  await mkdir(root(), { recursive: true });
  const key = `${randomUUID()}.${ext}`;
  await writeFile(path.join(/*turbopackIgnore: true*/ root(), key), bytes);
  return key;
}

function objectPath(key: string) {
  // Ключ генерирует сервер, но проверка не даст выйти за пределы каталога при повреждённой записи.
  if (path.basename(key) !== key) throw new Error("Некорректный ключ файла");
  return path.join(/*turbopackIgnore: true*/ root(), key);
}

export function objectStream(key: string) {
  return Readable.toWeb(createReadStream(objectPath(key))) as ReadableStream;
}

export async function removeObject(key: string) {
  await unlink(objectPath(key)).catch(() => undefined);
}
