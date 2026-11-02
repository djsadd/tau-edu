import { Award, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow, SectionHead } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getDegree, listPrograms } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const item = await getDegree((await params).slug);
  return item ? pageMeta(locale, `/degrees/${item.slug}`, tr(item.name, locale), tr(item.summary, locale)) : {};
}

export default async function DegreePage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const item = await getDegree((await params).slug);
  if (!item) notFound();
  const programs = await listPrograms({ degreeId: item.id });
  return (
    <>
      <PageHero title={tr(item.name, locale)} lead={tr(item.summary, locale)} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.degrees, href: `/${locale}/degrees` }, { label: tr(item.name, locale) }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_21rem]">
        <Prose html={tr(item.content, locale)} />
        <aside className="h-fit border-t-4 border-burgundy-700 bg-burgundy-50 px-5 py-3">
          {tr(item.awarded, locale) && <InfoRow icon={<Award className="h-5 w-5" />} label={dict.program.awarded}>{tr(item.awarded, locale)}</InfoRow>}
          {tr(item.duration, locale) && <InfoRow icon={<CalendarDays className="h-5 w-5" />} label={dict.program.duration}>{tr(item.duration, locale)}</InfoRow>}
        </aside>
      </div>
      {programs.length > 0 && (
        <section className="bg-burgundy-50 py-12 md:py-16">
          <div className="container-page">
            <SectionHead title={dict.structure.programs} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map(({ program, degree, faculty }) => <ProgramCard key={program.id} program={program} degree={degree} facultyName={tr(faculty.name, locale)} locale={locale} dict={dict} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
