import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OfficeCard, PersonCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow, SectionHead } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getOffice, staffOfOffice } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const row = await getOffice((await params).slug);
  return row ? pageMeta(locale, `/offices/${row.office.slug}`, tr(row.office.name, locale), tr(row.office.summary, locale)) : {};
}

export default async function OfficePage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const row = await getOffice((await params).slug);
  if (!row) notFound();
  const { office, parent, children } = row;
  const staff = await staffOfOffice(office.id);
  const head = staff.find((s) => s.appointment.isHead);
  const specialists = staff.filter((s) => !s.appointment.isHead);
  return (
    <>
      <PageHero title={tr(office.name, locale)} lead={tr(office.summary, locale)} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.offices, href: `/${locale}/offices` }, { label: tr(office.name, locale) }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_21rem]">
        <Prose html={tr(office.content, locale)} />
        <aside className="space-y-5">
          {parent && (
            <div className="border border-line p-5">
              <div className="eyebrow">{dict.structure.parentUnit}</div>
              <Link href={`/${locale}/offices/${parent.slug}`} className="mt-1.5 block font-serif text-lg font-semibold text-burgundy-950 hover:text-burgundy-700">{tr(parent.name, locale)}</Link>
            </div>
          )}
          {head && (
            <div>
              <h2 className="eyebrow mb-3 font-sans">{dict.people.head}</h2>
              <PersonCard person={head.person} appointment={head.appointment} locale={locale} />
            </div>
          )}
          <div className="border-t-4 border-burgundy-700 bg-burgundy-50 px-5 py-3">
            {office.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label={dict.common.phone}>{office.phone}</InfoRow>}
            {office.email && <InfoRow icon={<Mail className="h-4 w-4" />} label={dict.common.email}><a className="hover:underline" href={`mailto:${office.email}`}>{office.email}</a></InfoRow>}
            {tr(office.location, locale) && <InfoRow icon={<MapPin className="h-4 w-4" />} label={dict.common.location}>{tr(office.location, locale)}</InfoRow>}
            {tr(office.workingHours, locale) && <InfoRow icon={<Clock className="h-4 w-4" />} label={dict.common.workingHours}>{tr(office.workingHours, locale)}</InfoRow>}
          </div>
        </aside>
      </div>
      {specialists.length > 0 && (
        <section className="bg-burgundy-50 py-12 md:py-16">
          <div className="container-page">
            <SectionHead title={dict.people.specialists} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {specialists.map(({ person, appointment }) => <PersonCard key={appointment.id} person={person} appointment={appointment} locale={locale} />)}
            </div>
          </div>
        </section>
      )}
      {children.length > 0 && (
        <section className="container-page py-12 md:py-16">
          <SectionHead title={dict.structure.subunits} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children.map((o) => <OfficeCard key={o.id} item={o} locale={locale} dict={dict} />)}</div>
        </section>
      )}
    </>
  );
}
