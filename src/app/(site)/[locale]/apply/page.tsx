import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ApplyForm } from "@/components/site/ApplyForm";
import { PageHero } from "@/components/site/PageHero";
import { InfoRow } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getSiteConfig, listDegrees, listPrograms } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { isUuid, tr } from "@/lib/text";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMeta(locale, "/apply", dict.applyForm.title, dict.applyForm.lead);
}

export default async function ApplyPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ program?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const programParam = (await searchParams).program;
  const [config, degrees, programs] = await Promise.all([getSiteConfig(), listDegrees(), listPrograms()]);
  const options = {
    degrees: degrees.map((d) => ({ id: d.id, name: tr(d.name, locale) })),
    programs: programs.map(({ program }) => ({ id: program.id, name: tr(program.name, locale), degreeId: program.degreeId })),
  };
  return (
    <>
      <PageHero title={dict.applyForm.title} lead={dict.applyForm.lead} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.apply }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_20rem]">
        <div className="relative border border-line p-6 md:p-8">
          <ApplyForm locale={locale} labels={dict.applyForm} options={options} initialProgramId={isUuid(programParam) ? programParam : undefined} />
        </div>
        <aside className="h-fit border-t-4 border-burgundy-700 bg-burgundy-50 px-5 py-3">
          {config.admissionsPhone && <InfoRow icon={<Phone className="h-4 w-4" />} label={dict.common.phone}><a className="hover:underline" href={`tel:${config.admissionsPhone.replace(/[^\d+]/g, "")}`}>{config.admissionsPhone}</a></InfoRow>}
          {config.email && <InfoRow icon={<Mail className="h-4 w-4" />} label={dict.common.email}><a className="hover:underline" href={`mailto:${config.email}`}>{config.email}</a></InfoRow>}
        </aside>
      </div>
    </>
  );
}
