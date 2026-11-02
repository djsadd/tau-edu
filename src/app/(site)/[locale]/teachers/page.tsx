import type { Metadata } from "next";
import { PersonCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listDepartments, listFaculties, listTeachers } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { isUuid, tr } from "@/lib/text";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMeta(locale, "/teachers", getDictionary(locale).sections.teachers);
}

export default async function TeachersPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ faculty?: string; department?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const query = await searchParams;
  const facultyId = isUuid(query.faculty) ? query.faculty : undefined;
  const departmentId = isUuid(query.department) ? query.department : undefined;
  const [faculties, departments, rows] = await Promise.all([listFaculties(), listDepartments(), listTeachers({ facultyId, departmentId })]);
  const visible = facultyId ? departments.filter((d) => d.department.facultyId === facultyId) : departments;
  return (
    <>
      <PageHero title={dict.sections.teachers} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.teachers }]} />
      <div className="container-page py-12 md:py-16">
        <form className="mb-8 grid gap-3 border border-line bg-burgundy-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <select name="faculty" defaultValue={facultyId ?? ""} aria-label={dict.structure.faculty} className="field">
            <option value="">{dict.people.allFaculties}</option>
            {faculties.map((f) => <option key={f.id} value={f.id}>{tr(f.name, locale)}</option>)}
          </select>
          <select name="department" defaultValue={departmentId ?? ""} aria-label={dict.structure.department} className="field">
            <option value="">{dict.people.allDepartments}</option>
            {visible.map(({ department }) => <option key={department.id} value={department.id}>{tr(department.name, locale)}</option>)}
          </select>
          <button className="btn btn-primary">{dict.common.filter}</button>
        </form>
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ person, appointment, department }) => (
              <PersonCard key={appointment.id} person={person} appointment={appointment} locale={locale} note={tr(department.name, locale)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
