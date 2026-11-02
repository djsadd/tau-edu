import { BookOpen, CalendarDays, GraduationCap, Hash, Languages, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyButton } from "@/components/site/ApplyModal";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getProgram } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const row = await getProgram((await params).slug);
  return row ? pageMeta(locale, `/programs/${row.program.slug}`, tr(row.program.name, locale), tr(row.program.summary, locale)) : {};
}

export default async function ProgramPage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const row = await getProgram((await params).slug);
  if (!row) notFound();
  const { program, degree, faculty, department } = row;
  return (
    <>
      <PageHero title={tr(program.name, locale)} lead={tr(program.summary, locale)} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.programs, href: `/${locale}/programs` }, { label: tr(program.name, locale) }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_21rem]">
        <Prose html={tr(program.content, locale)} />
        <aside className="h-fit border-t-4 border-burgundy-700 bg-burgundy-50 p-5 lg:sticky lg:top-32">
          <InfoRow icon={<GraduationCap className="h-5 w-5" />} label={dict.program.degree}>
            <Link className="hover:underline" href={`/${locale}/degrees/${degree.slug}`}>{tr(degree.name, locale)}</Link>
          </InfoRow>
          {program.code && <InfoRow icon={<Hash className="h-5 w-5" />} label={dict.program.code}>{program.code}</InfoRow>}
          {program.durationYears && <InfoRow icon={<CalendarDays className="h-5 w-5" />} label={dict.program.duration}>{program.durationYears} {dict.program.years}</InfoRow>}
          {program.credits && <InfoRow icon={<Layers className="h-5 w-5" />} label={dict.program.credits}>{program.credits}</InfoRow>}
          {tr(program.languages, locale) && <InfoRow icon={<Languages className="h-5 w-5" />} label={dict.program.languages}>{tr(program.languages, locale)}</InfoRow>}
          {tr(program.studyForm, locale) && <InfoRow icon={<BookOpen className="h-5 w-5" />} label={dict.program.studyForm}>{tr(program.studyForm, locale)}</InfoRow>}
          <div className="my-2 border-t border-burgundy-200 pt-3 text-sm">
            <Link href={`/${locale}/faculties/${faculty.slug}`} className="block font-semibold text-burgundy-800 hover:underline">{tr(faculty.name, locale)}</Link>
            {department && <Link href={`/${locale}/departments/${department.slug}`} className="mt-1 block text-burgundy-700 hover:underline">{tr(department.name, locale)}</Link>}
          </div>
          <ApplyButton programId={program.id} className="btn btn-primary mt-3 w-full">{dict.program.applyFor}</ApplyButton>
        </aside>
      </div>
    </>
  );
}
