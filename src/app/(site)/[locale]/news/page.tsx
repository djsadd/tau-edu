import type { Metadata } from "next";
import { NewsCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty, Pagination } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listNews } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMeta(locale, "/news", getDictionary(locale).sections.news);
}

export default async function NewsPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ page?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { rows, pages } = await listNews(page);
  return (
    <>
      <PageHero title={dict.sections.news} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.news }]} />
      <div className="container-page py-12 md:py-16">
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((item) => <NewsCard key={item.id} item={item} locale={locale} />)}
          </div>
        )}
        <Pagination page={page} pages={pages} hrefFor={(p) => `/${locale}/news?page=${p}`} labels={dict.common} />
      </div>
    </>
  );
}
