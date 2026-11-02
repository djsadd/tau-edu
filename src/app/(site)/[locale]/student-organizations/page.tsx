import type { Metadata } from "next";
import { OrgCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listStudentOrgs } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMeta(locale, "/student-organizations", dict.sections.studentOrgs, dict.home.orgsLead);
}

export default async function OrgsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const rows = await listStudentOrgs();
  return (
    <>
      <PageHero title={dict.sections.studentOrgs} lead={dict.home.orgsLead} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.studentOrgs }]} />
      <div className="container-page py-12 md:py-16">
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((o) => <OrgCard key={o.id} item={o} locale={locale} />)}</div>
        )}
      </div>
    </>
  );
}
