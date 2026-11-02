import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonCard, ProgramCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow, SectionHead } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getDepartment, listPrograms, staffOfDepartment } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const row = await getDepartment((await params).slug);
  return row ? pageMeta(locale, `/departments/${row.department.slug}`, tr(row.department.name, locale), tr(row.department.summary, locale)) : {};
}

export default async function DepartmentPage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const row = await getDepartment((await params).slug);
  if (!row) notFound();
  const { department, faculty } = row;
  const [staff, programs] = await Promise.all([staffOfDepartment(department.id), listPrograms({ departmentId: department.id })]);
  const head = staff.find((s) => s.appointment.isHead);
  const others = staff.filter((s) => !s.appointment.isHead);
  return (
    <>
      <PageHero
        title={tr(department.name, locale)}
        lead={tr(department.summary, locale)}
        crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.departments, href: `/${locale}/departments` }, { label: tr(department.name, locale) }]}
      />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_21rem]">
        <Prose html={tr(department.content, locale)} />
        <aside className="space-y-5">
          <div className="border border-line p-5">
            <div className="eyebrow">{dict.structure.faculty}</div>
            <Link href={`/${locale}/faculties/${faculty.slug}`} className="mt-1.5 block font-serif text-lg font-semibold text-burgundy-950 hover:text-burgundy-700">{tr(faculty.name, locale)}</Link>
          </div>
          {head && (
            <div>
              <h2 className="eyebrow mb-3 font-sans">{dict.people.headOfDepartment}</h2>
              <PersonCard person={head.person} appointment={head.appointment} locale={locale} />
            </div>
          )}
          {(department.phone || department.email || tr(department.location, locale)) && (
            <div className="border-t-4 border-burgundy-700 bg-burgundy-50 px-5 py-3">
              {department.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label={dict.common.phone}>{department.phone}</InfoRow>}
              {department.email && <InfoRow icon={<Mail className="h-4 w-4" />} label={dict.common.email}><a className="hover:underline" href={`mailto:${department.email}`}>{department.email}</a></InfoRow>}
              {tr(department.location, locale) && <InfoRow icon={<MapPin className="h-4 w-4" />} label={dict.common.location}>{tr(department.location, locale)}</InfoRow>}
            </div>
          )}
        </aside>
      </div>
      {others.length > 0 && (
        <section className="bg-burgundy-50 py-12 md:py-16">
          <div className="container-page">
            <SectionHead title={dict.people.teachers} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map(({ person, appointment }) => <PersonCard key={appointment.id} person={person} appointment={appointment} locale={locale} />)}
            </div>
          </div>
        </section>
      )}
      {programs.length > 0 && (
        <section className="container-page py-12 md:py-16">
          <SectionHead title={dict.structure.programs} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map(({ program, degree }) => <ProgramCard key={program.id} program={program} degree={degree} locale={locale} dict={dict} />)}
          </div>
        </section>
      )}
    </>
  );
}
