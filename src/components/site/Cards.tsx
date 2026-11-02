import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, Clock, GraduationCap, Languages, Mail, MapPin, Phone } from "lucide-react";
import type { degrees, departments, events, faculties, news, offices, persons, programs, studentOrgs, appointments } from "@/db/schema";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { dateParts, formatDate, formatDateTime, tr } from "@/lib/text";
import { Avatar, Cover } from "./Cover";

type News = typeof news.$inferSelect;
type Event = typeof events.$inferSelect;
type Faculty = typeof faculties.$inferSelect;
type Department = typeof departments.$inferSelect;
type Program = typeof programs.$inferSelect;
type Degree = typeof degrees.$inferSelect;
type Office = typeof offices.$inferSelect;
type Person = typeof persons.$inferSelect;
type Appointment = typeof appointments.$inferSelect;
type Org = typeof studentOrgs.$inferSelect;

export function NewsCard({ item, locale, large = false }: { item: News; locale: Locale; large?: boolean }) {
  return (
    <Link href={`/${locale}/news/${item.slug}`} className="card group h-full">
      <div className={`overflow-hidden ${large ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        <Cover imageId={item.imageId} seed={item.slug} alt={tr(item.title, locale)} className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <time dateTime={new Date(item.publishedAt).toISOString()} className="text-sm font-medium text-burgundy-700">
          {formatDate(item.publishedAt, locale)}
        </time>
        <h3 className={`mt-2 leading-snug text-burgundy-950 group-hover:text-burgundy-700 ${large ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>{tr(item.title, locale)}</h3>
        <p className={`mt-3 leading-relaxed text-muted ${large ? "" : "line-clamp-3 text-[0.9375rem]"}`}>{tr(item.summary, locale)}</p>
      </div>
    </Link>
  );
}

export function EventRow({ item, locale }: { item: Event; locale: Locale }) {
  const { day, month } = dateParts(item.startsAt, locale);
  return (
    <Link href={`/${locale}/events/${item.slug}`} className="group flex gap-4 border-b border-line py-4 first:pt-0 last:border-b-0">
      <span className="flex h-[4.25rem] w-[4.25rem] shrink-0 flex-col items-center justify-center bg-burgundy-700 text-white transition-colors group-hover:bg-burgundy-900">
        <span className="font-serif text-2xl font-semibold leading-none">{day}</span>
        <span className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-wider">{month}</span>
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-[1.0625rem] font-semibold leading-snug text-burgundy-950 group-hover:text-burgundy-700">{tr(item.title, locale)}</span>
        {tr(item.location, locale) && (
          <span className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {tr(item.location, locale)}
          </span>
        )}
      </span>
    </Link>
  );
}

export function EventCard({ item, locale }: { item: Event; locale: Locale }) {
  const { day, month } = dateParts(item.startsAt, locale);
  return (
    <Link href={`/${locale}/events/${item.slug}`} className="card group h-full">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Cover imageId={item.imageId} seed={item.slug} alt={tr(item.title, locale)} className="transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-4 top-4 flex h-16 w-16 flex-col items-center justify-center bg-white text-burgundy-800 shadow-card">
          <span className="font-serif text-2xl font-semibold leading-none">{day}</span>
          <span className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-wider">{month}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg leading-snug text-burgundy-950 group-hover:text-burgundy-700">{tr(item.title, locale)}</h3>
        <p className="mt-2 line-clamp-2 text-[0.9375rem] text-muted">{tr(item.summary, locale)}</p>
        <div className="mt-auto space-y-1 pt-4 text-sm text-muted">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{formatDateTime(item.startsAt, locale)}</span>
          {tr(item.location, locale) && (
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{tr(item.location, locale)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function FacultyCard({ item, locale }: { item: Faculty; locale: Locale }) {
  return (
    <Link href={`/${locale}/faculties/${item.slug}`} className="card group h-full">
      <div className="aspect-[16/9] overflow-hidden">
        <Cover imageId={item.imageId} seed={item.slug} alt={tr(item.name, locale)} className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="flex items-start justify-between gap-3 text-xl leading-snug text-burgundy-950 group-hover:text-burgundy-700">
          {tr(item.name, locale)}
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-burgundy-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </h3>
        <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-muted">{tr(item.summary, locale)}</p>
      </div>
    </Link>
  );
}

export function DepartmentCard({ item, facultyName, locale }: { item: Department; facultyName?: string; locale: Locale }) {
  return (
    <Link href={`/${locale}/departments/${item.slug}`} className="card group h-full border-l-[3px] border-l-burgundy-700 p-5">
      {facultyName && <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{facultyName}</span>}
      <h3 className="text-lg leading-snug text-burgundy-950 group-hover:text-burgundy-700">{tr(item.name, locale)}</h3>
      <p className="mt-2 line-clamp-2 text-[0.9375rem] text-muted">{tr(item.summary, locale)}</p>
    </Link>
  );
}

export function ProgramCard({ program, degree, facultyName, locale, dict }: { program: Program; degree: Degree; facultyName?: string; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={`/${locale}/programs/${program.slug}`} className="card group h-full p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-burgundy-700 px-2.5 py-1 text-xs font-semibold text-white">{tr(degree.name, locale)}</span>
        {program.code && <span className="border border-line px-2.5 py-1 text-xs font-medium text-muted">{program.code}</span>}
      </div>
      <h3 className="mt-3 text-xl leading-snug text-burgundy-950 group-hover:text-burgundy-700">{tr(program.name, locale)}</h3>
      {facultyName && <p className="mt-1.5 text-sm text-muted">{facultyName}</p>}
      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1.5 pt-4 text-sm text-muted">
        {program.durationYears && (
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-burgundy-700" aria-hidden="true" />{program.durationYears} {dict.program.years}</span>
        )}
        {tr(program.languages, locale) && (
          <span className="flex items-center gap-1.5"><Languages className="h-4 w-4 text-burgundy-700" aria-hidden="true" />{tr(program.languages, locale)}</span>
        )}
      </div>
    </Link>
  );
}

export function DegreeCard({ item, index, count, locale, dict }: { item: Degree; index: number; count: number; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={`/${locale}/degrees/${item.slug}`} className="card group h-full p-6 md:p-8">
      <div className="flex items-start justify-between">
        <span className="font-serif text-5xl font-semibold text-burgundy-200 transition-colors group-hover:text-burgundy-700">{String(index + 1).padStart(2, "0")}</span>
        <GraduationCap className="h-7 w-7 text-burgundy-700" aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-2xl text-burgundy-950">{tr(item.name, locale)}</h3>
      <p className="mt-2 leading-relaxed text-muted">{tr(item.summary, locale)}</p>
      <div className="mt-auto flex flex-wrap justify-between gap-2 pt-6 text-sm font-semibold text-burgundy-700">
        <span>{tr(item.duration, locale)}</span>
        <span>{count} {dict.home.programsCount}</span>
      </div>
    </Link>
  );
}

export function PersonCard({ person, appointment, locale, note }: { person: Person; appointment?: Appointment; locale: Locale; note?: string }) {
  const name = tr(person.fullName, locale);
  return (
    <Link href={`/${locale}/people/${person.slug}`} className="card group h-full flex-row gap-4 p-4">
      <Avatar imageId={person.imageId} name={name} className="h-24 w-20 text-2xl" />
      <span className="min-w-0">
        <span className="block font-serif text-lg font-semibold leading-snug text-burgundy-950 group-hover:text-burgundy-700">{name}</span>
        {appointment && <span className="mt-1 block text-sm leading-snug text-muted">{tr(appointment.position, locale)}</span>}
        {tr(person.academicDegree, locale) && <span className="mt-1 block text-sm text-muted">{tr(person.academicDegree, locale)}</span>}
        {note && <span className="mt-1.5 block text-xs font-medium text-burgundy-700">{note}</span>}
      </span>
    </Link>
  );
}

export function OfficeCard({ item, locale, dict }: { item: Office; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={`/${locale}/offices/${item.slug}`} className="card group h-full p-5 md:p-6">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-burgundy-700">
        <Building2 className="h-4 w-4" aria-hidden="true" />
        {dict.structure.kinds[item.kind]}
      </span>
      <h3 className="mt-3 text-xl leading-snug text-burgundy-950 group-hover:text-burgundy-700">{tr(item.name, locale)}</h3>
      <p className="mt-2 line-clamp-2 text-[0.9375rem] text-muted">{tr(item.summary, locale)}</p>
      <div className="mt-auto space-y-1 pt-4 text-sm text-muted">
        {item.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{item.phone}</span>}
        {item.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{item.email}</span>}
      </div>
    </Link>
  );
}

export function OrgCard({ item, locale }: { item: Org; locale: Locale }) {
  return (
    <Link href={`/${locale}/student-organizations/${item.slug}`} className="card group h-full">
      <div className="aspect-[2/1] overflow-hidden">
        <Cover imageId={item.imageId} seed={item.slug} alt={tr(item.name, locale)} className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex-1 p-5">
        {tr(item.category, locale) && <span className="text-xs font-semibold uppercase tracking-wider text-burgundy-700">{tr(item.category, locale)}</span>}
        <h3 className="mt-1.5 text-lg leading-snug text-burgundy-950 group-hover:text-burgundy-700">{tr(item.name, locale)}</h3>
        <p className="mt-2 line-clamp-3 text-[0.9375rem] text-muted">{tr(item.summary, locale)}</p>
      </div>
    </Link>
  );
}
