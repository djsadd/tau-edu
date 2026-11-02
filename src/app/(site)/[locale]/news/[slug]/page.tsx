import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsCard } from "@/components/site/Cards";
import { Cover } from "@/components/site/Cover";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { SectionHead } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getNews, latestNews } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { formatDate, tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const item = await getNews((await params).slug);
  return item ? pageMeta(locale, `/news/${item.slug}`, tr(item.title, locale), tr(item.summary, locale)) : {};
}

export default async function NewsArticle({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const item = await getNews((await params).slug);
  if (!item) notFound();
  const more = (await latestNews(4)).filter((n) => n.id !== item.id).slice(0, 3);
  return (
    <>
      <PageHero
        title={tr(item.title, locale)}
        crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.news, href: `/${locale}/news` }, { label: formatDate(item.publishedAt, locale) }]}
      />
      <article className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          {item.imageId && <div className="mb-8 aspect-[16/9] overflow-hidden"><Cover imageId={item.imageId} seed={item.slug} alt={tr(item.title, locale)} priority /></div>}
          <p className="mb-6 font-serif text-xl leading-relaxed text-burgundy-950">{tr(item.summary, locale)}</p>
          <Prose html={tr(item.content, locale)} className="max-w-none" />
        </div>
      </article>
      {more.length > 0 && (
        <section className="bg-burgundy-50 py-12 md:py-16">
          <div className="container-page">
            <SectionHead title={dict.home.newsTitle} href={`/${locale}/news`} linkLabel={dict.common.allNews} />
            <div className="grid gap-6 md:grid-cols-3">{more.map((n) => <NewsCard key={n.id} item={n} locale={locale} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
