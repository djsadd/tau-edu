import type { Metadata } from "next";
import { ProgramCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listDegrees, listFaculties, listPrograms } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { isUuid, tr } from "@/lib/text";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMeta(locale, "/programs", dict.sections.programs, dict.home.degreesLead);
}

export default async function ProgramsPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ degree?: string; faculty?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const query = await searchParams;
  const degreeId = isUuid(query.degree) ? query.degree : undefined;
  const facultyId = isUuid(query.faculty) ? query.faculty : undefined;
  const [degrees, faculties, rows] = await Promise.all([listDegrees(), listFaculties(), listPrograms({ degreeId, facultyId })]);
  return (
    <>
      <PageHero title={dict.sections.programs} lead={dict.home.degreesLead} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.programs }]} />
      <div className="container-page py-12 md:py-16">
        <form className="mb-8 grid gap-3 border border-line bg-burgundy-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <select name="degree" defaultValue={degreeId ?? ""} aria-label={dict.program.degree} className="field">
            <option value="">{dict.program.allDegrees}</option>
            {degrees.map((d) => <option key={d.id} value={d.id}>{tr(d.name, locale)}</option>)}
          </select>
          <select name="faculty" defaultValue={facultyId ?? ""} aria-label={dict.structure.faculty} className="field">
            <option value="">{dict.people.allFaculties}</option>
            {faculties.map((f) => <option key={f.id} value={f.id}>{tr(f.name, locale)}</option>)}
          </select>
          <button className="btn btn-primary">{dict.common.filter}</button>
        </form>
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ program, degree, faculty }) => <ProgramCard key={program.id} program={program} degree={degree} facultyName={tr(faculty.name, locale)} locale={locale} dict={dict} />)}
          </div>
        )}
      </div>
    </>
  );
}
