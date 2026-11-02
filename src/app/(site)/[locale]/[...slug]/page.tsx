import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cover } from "@/components/site/Cover";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { getDictionary } from "@/i18n";
import { getPage } from "@/lib/content";
import { pageMeta, resolveLocale } from "@/lib/page";
import { tr } from "@/lib/text";

type Props = { params: Promise<{ locale: string; slug: string[] }> };

/** Страницы, созданные в админке. Адрес хранится в поле path, например about/history. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const path = (await params).slug.join("/");
  const page = await getPage(path);
  return page ? pageMeta(locale, `/${path}`, tr(page.title, locale), tr(page.summary, locale)) : {};
}

export default async function CustomPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const page = await getPage((await params).slug.join("/"));
  if (!page) notFound();
  return (
    <>
      <PageHero title={tr(page.title, locale)} lead={tr(page.summary, locale)} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: tr(page.title, locale) }]} />
      <div className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          {page.imageId && <div className="mb-8 aspect-[16/9] overflow-hidden"><Cover imageId={page.imageId} seed={page.path} alt={tr(page.title, locale)} priority /></div>}
          <Prose html={tr(page.content, locale)} className="max-w-none" />
        </div>
      </div>
    </>
  );
}
