import type { Localized } from "@/db/schema";
import { LOCALES } from "@/i18n/config";
import { sanitizeRich } from "@/lib/sanitize";
import { RESERVED_PATHS } from "@/lib/sections";
import { isUuid, slugify } from "@/lib/text";
import type { Field } from "./fields";

export class FormError extends Error {}

/** Значение datetime-local вводится по времени Астаны. */
function parseDateTime(value: string) {
  const date = new Date(`${value}:00+05:00`);
  if (Number.isNaN(date.getTime())) throw new FormError("Некорректная дата");
  return date;
}

export function parseFields(fields: Field[], form: FormData) {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = () => String(form.get(field.name) ?? "").trim();
    switch (field.type) {
      case "ltext":
      case "ltextarea":
      case "lrich": {
        const value: Localized = {};
        for (const locale of LOCALES) {
          let text = String(form.get(`${field.name}.${locale}`) ?? "").trim();
          if (field.type === "lrich") {
            text = sanitizeRich(text);
            if (text === "<p></p>") text = "";
          }
          if (text) value[locale] = text;
        }
        if (field.required && !Object.keys(value).length) throw new FormError(`Заполните поле «${field.label}» хотя бы на одном языке`);
        values[field.name] = value;
        break;
      }
      case "checkbox":
        values[field.name] = form.get(field.name) === "on";
        break;
      case "number": {
        const text = raw();
        const parsed = text === "" ? null : Number(text);
        if (parsed !== null && !Number.isInteger(parsed)) throw new FormError(`Поле «${field.label}» должно быть целым числом`);
        values[field.name] = field.name === "sortOrder" ? (parsed ?? 0) : parsed;
        break;
      }
      case "datetime": {
        const text = raw();
        if (!text && field.required) throw new FormError(`Заполните поле «${field.label}»`);
        values[field.name] = text ? parseDateTime(text) : null;
        break;
      }
      case "image":
      case "relation": {
        const text = raw();
        if (!text && field.required) throw new FormError(`Заполните поле «${field.label}»`);
        if (text && !isUuid(text)) throw new FormError(`Некорректное значение поля «${field.label}»`);
        values[field.name] = text || null;
        break;
      }
      case "url": {
        const text = raw();
        if (text && !/^https?:\/\//i.test(text)) throw new FormError(`Поле «${field.label}» должно начинаться с http:// или https://`);
        values[field.name] = text || null;
        break;
      }
      case "email": {
        const text = raw();
        if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new FormError(`Некорректная почта в поле «${field.label}»`);
        values[field.name] = text || null;
        break;
      }
      case "slug": {
        let text = slugify(raw());
        if (!text && field.slugFrom) {
          const source = values[field.slugFrom] as Localized;
          text = slugify(source?.en || source?.ru || source?.kk || "");
        }
        if (!text) throw new FormError("Укажите адрес (slug)");
        values[field.name] = text;
        break;
      }
      case "path": {
        const text = raw().replace(/^\/+|\/+$/g, "").toLowerCase();
        if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(text)) throw new FormError("Адрес страницы: только латиница, цифры, дефис и /");
        if (RESERVED_PATHS.has(text.split("/")[0]) || /^(kk|ru|en)$/.test(text.split("/")[0])) {
          throw new FormError(`Адрес «${text.split("/")[0]}» занят встроенным разделом сайта`);
        }
        values[field.name] = text;
        break;
      }
      case "appointments":
        break;
      default: {
        const text = raw();
        if (!text && field.required) throw new FormError(`Заполните поле «${field.label}»`);
        values[field.name] = text || null;
      }
    }
  }
  return values;
}

/** Текст понятной ошибки для ограничений базы. Драйверы по-разному вкладывают исходную ошибку. */
export function dbErrorMessage(error: unknown) {
  const pg = (error as { cause?: { code?: string }; code?: string }) ?? {};
  const code = pg.code ?? pg.cause?.code;
  if (code === "23505") return "Такой адрес или значение уже используется. Укажите другое.";
  // RESTRICT даёт 23001 в новых версиях Postgres и 23503 в старых.
  if (code === "23503" || code === "23001") return "Нельзя выполнить: есть связанные записи. Сначала измените или удалите их.";
  if (code === "23514") return "Проверьте должности: для каждой роли нужно выбрать соответствующее подразделение.";
  return null;
}
