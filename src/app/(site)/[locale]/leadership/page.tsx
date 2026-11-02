import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/site/Cover";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listLeadership } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMeta(locale, "/leadership", getDictionary(locale).sections.leadership);
}

export default async function LeadershipPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const rows = await listLeadership();
  const [first, ...rest] = rows;
  return (
    <>
      <PageHero title={dict.sections.leadership} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.leadership }]} />
      <div className="container-page py-12 md:py-16">
        {!first && <Empty>{dict.common.empty}</Empty>}
        {first && (
          <Link href={`/${locale}/people/${first.person.slug}`} className="card group mb-8 flex-col gap-6 p-6 sm:flex-row md:gap-10 md:p-8">
            <Avatar imageId={first.person.imageId} name={tr(first.person.fullName, locale)} className="aspect-[4/5] w-48 text-6xl md:w-56" />
            <span className="self-center">
              <span className="eyebrow">{tr(first.appointment.position, locale)}</span>
              <span className="mt-2 block font-serif text-3xl font-semibold text-burgundy-950 group-hover:text-burgundy-700 md:text-4xl">{tr(first.person.fullName, locale)}</span>
              {tr(first.person.academicDegree, locale) && <span className="mt-3 block text-muted">{tr(first.person.academicDegree, locale)}{tr(first.person.academicTitle, locale) && `, ${tr(first.person.academicTitle, locale)}`}</span>}
              <span className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                {first.person.email && <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-burgundy-700" aria-hidden="true" />{first.person.email}</span>}
                {first.person.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-burgundy-700" aria-hidden="true" />{first.person.phone}</span>}
              </span>
            </span>
          </Link>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map(({ person, appointment }) => (
            <Link key={appointment.id} href={`/${locale}/people/${person.slug}`} className="card group h-full flex-row gap-4 p-4">
              <Avatar imageId={person.imageId} name={tr(person.fullName, locale)} className="h-32 w-26 text-3xl" />
              <span className="min-w-0 self-center">
                <span className="block font-serif text-lg font-semibold leading-snug text-burgundy-950 group-hover:text-burgundy-700">{tr(person.fullName, locale)}</span>
                <span className="mt-1.5 block text-sm leading-snug text-muted">{tr(appointment.position, locale)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
