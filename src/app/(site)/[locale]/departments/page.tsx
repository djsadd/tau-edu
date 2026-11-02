import type { Metadata } from "next";
import { DepartmentCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty, SectionHead } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listDepartments, listFaculties } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMeta(locale, "/departments", getDictionary(locale).sections.departments);
}

export default async function DepartmentsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [faculties, rows] = await Promise.all([listFaculties(), listDepartments()]);
  return (
    <>
      <PageHero title={dict.sections.departments} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.departments }]} />
      <div className="container-page space-y-14 py-12 md:py-16">
        {rows.length === 0 && <Empty>{dict.common.empty}</Empty>}
        {faculties.map((faculty) => {
          const items = rows.filter((r) => r.department.facultyId === faculty.id);
          if (!items.length) return null;
          return (
            <section key={faculty.id}>
              <SectionHead title={tr(faculty.name, locale)} href={`/${locale}/faculties/${faculty.slug}`} linkLabel={dict.common.readMore} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(({ department }) => <DepartmentCard key={department.id} item={department} locale={locale} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
