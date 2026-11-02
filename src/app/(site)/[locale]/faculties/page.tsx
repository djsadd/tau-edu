import type { Metadata } from "next";
import { FacultyCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listFaculties } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMeta(locale, "/faculties", dict.sections.faculties, dict.home.facultiesLead);
}

export default async function FacultiesPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const rows = await listFaculties();
  return (
    <>
      <PageHero title={dict.sections.faculties} lead={dict.home.facultiesLead} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.faculties }]} />
      <div className="container-page py-12 md:py-16">
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((f) => <FacultyCard key={f.id} item={f} locale={locale} />)}</div>
        )}
      </div>
    </>
  );
}
