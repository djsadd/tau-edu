import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { searchSite, ServiceError, type SearchHit } from "@/lib/services";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { ...pageMeta(locale, "/search", getDictionary(locale).search.title), robots: { index: false } };
}

export default async function SearchPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ q?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim();
  let hits: SearchHit[] = [];
  let unavailable = false;
  if (q) {
    try {
      hits = await searchSite(q, locale);
    } catch (error) {
      if (!(error instanceof ServiceError)) throw error;
      unavailable = true;
    }
  }
  return (
    <>
      <PageHero title={dict.search.title} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.search }]} />
      <div className="container-page py-12 md:py-16">
        <form role="search" className="mx-auto mb-10 flex max-w-3xl gap-2">
          <input name="q" type="search" defaultValue={q} placeholder={dict.common.searchPlaceholder} aria-label={dict.common.searchPlaceholder} className="field text-lg" />
          <button className="btn btn-primary shrink-0"><Search className="h-5 w-5" aria-hidden="true" /><span className="max-sm:sr-only">{dict.common.search}</span></button>
        </form>
        <div className="mx-auto max-w-3xl">
          {!q && <p className="text-center text-muted">{dict.search.prompt}</p>}
          {q && hits.length === 0 && <Empty>{unavailable ? dict.common.unavailable : dict.search.nothing}</Empty>}
          {hits.length > 0 && (
            <>
              <p className="mb-4 text-sm text-muted">{dict.search.resultsFor} «{q}»: {hits.length}</p>
              <ul className="divide-y divide-line border-y border-line">
                {hits.map((hit) => (
                  <li key={`${hit.entityType}${hit.entityId}`}>
                    <Link href={`/${locale}${hit.url}`} className="group block py-5 sm:px-3 hover:bg-burgundy-50">
                      <span className="eyebrow">{dict.search.types[hit.entityType]}</span>
                      <span className="mt-1 block font-serif text-xl font-semibold text-burgundy-950 group-hover:text-burgundy-700">{hit.title}</span>
                      {hit.summary && <span className="mt-1 line-clamp-2 block text-muted">{hit.summary}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
