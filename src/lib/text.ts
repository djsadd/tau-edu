import type { Localized } from "@/db/schema";
import { LOCALE_LABELS, type Locale } from "@/i18n/config";

/** Текст на нужном языке; если перевода нет — на первом заполненном. */
export function tr(value: Localized | null | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] || value.ru || value.kk || value.en || "";
}

export function formatDate(date: Date | string, locale: Locale, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE_LABELS[locale].intl, {
    timeZone: "Asia/Almaty",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale: Locale) {
  return formatDate(date, locale, { hour: "2-digit", minute: "2-digit" });
}

export function dateParts(date: Date | string, locale: Locale) {
  const d = new Date(date);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(LOCALE_LABELS[locale].intl, { timeZone: "Asia/Almaty", ...o }).format(d);
  return { day: fmt({ day: "numeric" }), month: fmt({ month: "short" }).replace(".", "") };
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const TRANSLIT: Record<string, string> = {
  а: "a", ә: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i",
  к: "k", қ: "q", л: "l", м: "m", н: "n", ң: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ұ: "u", ү: "u", ф: "f", х: "h", һ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", і: "i", ь: "",
  э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .split("")
    .map((c) => TRANSLIT[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function fileUrl(id: string | null | undefined) {
  return id ? `/files/${id}` : null;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
