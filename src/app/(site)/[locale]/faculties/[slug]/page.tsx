import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DepartmentCard, EventRow, NewsCard, PersonCard, ProgramCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow, SectionHead } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { deanOfFaculty, departmentsOfFaculty, getFaculty, listEvents, listNews, listPrograms } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const item = await getFaculty((await params).slug);
  return item ? pageMeta(locale, `/faculties/${item.slug}`, tr(item.name, locale), tr(item.summary, locale)) : {};
}

export default async function FacultyPage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const item = await getFaculty((await params).slug);
  if (!item) notFound();
  const [dean, departments, programs, news, events] = await Promise.all([
    deanOfFaculty(item.id),
    departmentsOfFaculty(item.id),
    listPrograms({ facultyId: item.id }),
    listNews(1, item.id, 3),
    listEvents("upcoming", 3, item.id),
  ]);
  return (
    <>
      <PageHero title={tr(item.name, locale)} lead={tr(item.summary, locale)} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.faculties, href: `/${locale}/faculties` }, { label: tr(item.name, locale) }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_21rem]">
        <Prose html={tr(item.content, locale)} />
        <aside className="space-y-5">
          {dean && (
            <div>
              <h2 className="eyebrow mb-3 font-sans">{dict.people.dean}</h2>
              <PersonCard person={dean.person} appointment={dean.appointment} locale={locale} />
            </div>
          )}
          {(item.phone || item.email || tr(item.location, locale)) && (
            <div className="border-t-4 border-burgundy-700 bg-burgundy-50 px-5 py-3">
              {item.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label={dict.common.phone}>{item.phone}</InfoRow>}
              {item.email && <InfoRow icon={<Mail className="h-4 w-4" />} label={dict.common.email}><a className="hover:underline" href={`mailto:${item.email}`}>{item.email}</a></InfoRow>}
              {tr(item.location, locale) && <InfoRow icon={<MapPin className="h-4 w-4" />} label={dict.common.address}>{tr(item.location, locale)}</InfoRow>}
            </div>
          )}
        </aside>
      </div>
      {departments.length > 0 && (
        <section className="bg-burgundy-50 py-12 md:py-16">
          <div className="container-page">
            <SectionHead title={dict.structure.departments} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{departments.map((d) => <DepartmentCard key={d.id} item={d} locale={locale} />)}</div>
          </div>
        </section>
      )}
      {programs.length > 0 && (
        <section className="container-page py-12 md:py-16">
          <SectionHead title={dict.structure.programs} href={`/${locale}/programs?faculty=${item.id}`} linkLabel={dict.common.allPrograms} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map(({ program, degree }) => <ProgramCard key={program.id} program={program} degree={degree} locale={locale} dict={dict} />)}
          </div>
        </section>
      )}
      {(news.rows.length > 0 || events.length > 0) && (
        <section className="container-page grid gap-10 pb-16 lg:grid-cols-[2fr_1fr]">
          {news.rows.length > 0 && (
            <div>
              <SectionHead title={dict.structure.relatedNews} />
              <div className="grid gap-6 md:grid-cols-2">{news.rows.slice(0, 2).map((n) => <NewsCard key={n.id} item={n} locale={locale} />)}</div>
            </div>
          )}
          {events.length > 0 && (
            <div>
              <SectionHead title={dict.home.eventsTitle} />
              {events.map((e) => <EventRow key={e.id} item={e} locale={locale} />)}
            </div>
          )}
        </section>
      )}
    </>
  );
}
