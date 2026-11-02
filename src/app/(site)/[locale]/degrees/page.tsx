import type { Metadata } from "next";
import { DegreeCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listDegrees, programCountsByDegree } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMeta(locale, "/degrees", dict.sections.degrees, dict.home.degreesLead);
}

export default async function DegreesPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [rows, counts] = await Promise.all([listDegrees(), programCountsByDegree()]);
  return (
    <>
      <PageHero title={dict.sections.degrees} lead={dict.home.degreesLead} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.degrees }]} />
      <div className="container-page py-12 md:py-16">
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-6 md:grid-cols-3">{rows.map((d, i) => <DegreeCard key={d.id} item={d} index={i} count={counts.get(d.id) ?? 0} locale={locale} dict={dict} />)}</div>
        )}
      </div>
    </>
  );
}
