import { Award, GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/site/Cover";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getPerson } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const row = await getPerson((await params).slug);
  return row ? pageMeta(locale, `/people/${row.person.slug}`, tr(row.person.fullName, locale)) : {};
}

export default async function PersonPage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const row = await getPerson((await params).slug);
  if (!row) notFound();
  const { person, roles } = row;
  const name = tr(person.fullName, locale);
  const orcid = person.orcid && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(person.orcid) ? person.orcid : null;
  return (
    <>
      <PageHero title={name} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: name }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[18rem_1fr]">
        <aside>
          <Avatar imageId={person.imageId} name={name} className="aspect-[4/5] w-full max-w-72 text-7xl" />
          <div className="mt-5 max-w-72 divide-y divide-line">
            {person.email && <InfoRow icon={<Mail className="h-4 w-4" />} label={dict.common.email}><a className="hover:underline" href={`mailto:${person.email}`}>{person.email}</a></InfoRow>}
            {person.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label={dict.common.phone}>{person.phone}</InfoRow>}
            {tr(person.location, locale) && <InfoRow icon={<MapPin className="h-4 w-4" />} label={dict.common.location}>{tr(person.location, locale)}</InfoRow>}
          </div>
        </aside>
        <div>
          <ul className="space-y-3">
            {roles.map(({ appointment, department, office, faculty }) => {
              const unit = department
                ? { href: `/departments/${department.slug}`, name: tr(department.name, locale) }
                : office
                  ? { href: `/offices/${office.slug}`, name: tr(office.name, locale) }
                  : faculty
                    ? { href: `/faculties/${faculty.slug}`, name: tr(faculty.name, locale) }
                    : null;
              return (
                <li key={appointment.id} className="border-l-[3px] border-burgundy-700 pl-4">
                  <span className="block font-serif text-xl font-semibold text-burgundy-950">{tr(appointment.position, locale)}</span>
                  {unit && <Link href={`/${locale}${unit.href}`} className="mt-0.5 block text-burgundy-700 hover:underline">{unit.name}</Link>}
                </li>
              );
            })}
          </ul>
          <div className="my-7 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {tr(person.academicDegree, locale) && <InfoRow icon={<GraduationCap className="h-5 w-5" />} label={dict.people.academicDegree}>{tr(person.academicDegree, locale)}</InfoRow>}
            {tr(person.academicTitle, locale) && <InfoRow icon={<Award className="h-5 w-5" />} label={dict.people.academicTitle}>{tr(person.academicTitle, locale)}</InfoRow>}
          </div>
          {tr(person.bio, locale) && (
            <>
              <h2 className="mb-4 text-2xl text-burgundy-950">{dict.people.biography}</h2>
              <Prose html={tr(person.bio, locale)} />
            </>
          )}
          {orcid && <p className="mt-6 text-sm"><a className="text-burgundy-700 underline" href={`https://orcid.org/${orcid}`} target="_blank" rel="noopener noreferrer">ORCID: {orcid}</a></p>}
        </div>
      </div>
    </>
  );
}
