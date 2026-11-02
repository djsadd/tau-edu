import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";

export type LocaleParams = { params: Promise<{ locale: string }> };
export type SlugParams = { params: Promise<{ locale: string; slug: string }> };

export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Заголовок, описание, canonical и ссылки на версии страницы на других языках. */
export function pageMeta(locale: Locale, path: string, title: string, description?: string): Metadata {
  return {
    title,
    description: description || undefined,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_LABELS[l].intl, `/${l}${path}`])),
    },
    openGraph: { title, description: description || undefined, locale: LOCALE_LABELS[locale].og, type: "website" },
  };
}
