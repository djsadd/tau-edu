import type { MetadataRoute } from "next";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { siteUrl } from "@/lib/page";
import { SECTIONS } from "@/lib/sections";
import { indexedUrls } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  // Поисковый индекс содержит ровно все опубликованные адреса.
  // Без сервиса поиска отдаём хотя бы разделы: поисковик получит полную карту при следующем обходе.
  const urls = await indexedUrls().catch(() => []);
  const paths = new Set<string>([...Object.values(SECTIONS).filter((p) => p !== "/search"), ...urls]);
  return [...paths].map((path) => ({
    url: `${base}/${LOCALES[1]}${path}`,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_LABELS[l].intl, `${base}/${l}${path}`])),
    },
  }));
}
