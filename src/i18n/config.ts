export const LOCALES = ["kk", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string; intl: string; og: string }> = {
  kk: { short: "ҚАЗ", name: "Қазақша", intl: "kk-KZ", og: "kk_KZ" },
  ru: { short: "РУС", name: "Русский", intl: "ru-RU", og: "ru_RU" },
  en: { short: "ENG", name: "English", intl: "en-GB", og: "en_GB" },
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
