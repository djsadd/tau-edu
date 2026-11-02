import { ArrowRight, BookOpen, Building2, FileText, Landmark } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ApplyButton } from "@/components/site/ApplyModal";
import { ApplyForm } from "@/components/site/ApplyForm";
import { DegreeCard, EventRow, FacultyCard, NewsCard, OrgCard } from "@/components/site/Cards";
import { Avatar, Cover } from "@/components/site/Cover";
import { HeroArt } from "@/components/site/HeroArt";
import { SectionHead } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getSiteConfig, latestNews, listDegrees, listEvents, listFaculties, listLeadership, listPrograms, listStudentOrgs, programCountsByDegree } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const config = await getSiteConfig();
  return { ...pageMeta(locale, "", tr(config.name, locale), tr(config.heroSubtitle, locale)), title: { absolute: tr(config.name, locale) } };
}

export default async function HomePage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [config, faculties, degrees, counts, news, upcoming, orgs, leadership, programs] = await Promise.all([
    getSiteConfig(),
    listFaculties(),
    listDegrees(),
    programCountsByDegree(),
    latestNews(4),
    listEvents("upcoming", 4),
    listStudentOrgs(4),
    listLeadership(),
    listPrograms(),
  ]);
  const rector = leadership[0];
  const [lead, ...restNews] = news;
  const stats = ([1, 2, 3, 4] as const)
    .map((n) => ({ value: config[`stat${n}Value`], label: tr(config[`stat${n}Label`], locale) }))
    .filter((s) => s.value);
  const quick = [
    { href: "/programs", label: dict.sections.programs, icon: BookOpen },
    { href: "/leadership", label: dict.sections.leadership, icon: Landmark },
    { href: "/offices", label: dict.sections.offices, icon: Building2 },
    { href: "/documents", label: dict.sections.documents, icon: FileText },
  ];
  const applyOptions = {
    degrees: degrees.map((d) => ({ id: d.id, name: tr(d.name, locale) })),
    programs: programs.map(({ program }) => ({ id: program.id, name: tr(program.name, locale), degreeId: program.degreeId })),
  };

  return (
    <>
      {/* Первый экран */}
      <section className="relative overflow-hidden bg-burgundy-950 text-white">
        {config.heroImageId ? (
          <div className="absolute inset-0">
            <Cover imageId={config.heroImageId} seed="hero" priority className="opacity-40" />
          </div>
        ) : (
          <HeroArt />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-burgundy-950 via-burgundy-900/70 to-transparent" aria-hidden="true" />
        <div className="container-page relative pb-28 pt-16 md:pb-36 md:pt-24 lg:pb-44 lg:pt-28">
          <div className="animate-rise max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-burgundy-200">{dict.home.eyebrow}</p>
            <h1 className="mt-5 text-4xl leading-[1.08] md:text-6xl lg:text-7xl">{tr(config.heroTitle, locale)}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-burgundy-100 md:text-xl">{tr(config.heroSubtitle, locale)}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ApplyButton className="btn btn-inverse px-6 py-3.5 text-base">{dict.common.apply}<ArrowRight className="h-4 w-4" aria-hidden="true" /></ApplyButton>
              <Link href={`/${locale}/programs`} className="btn btn-ghost-inverse px-6 py-3.5 text-base">{dict.home.explore}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Цифры */}
      {stats.length > 0 && (
        <section className="container-page relative z-10 -mt-16 md:-mt-20">
          <dl className="grid grid-cols-2 divide-line bg-white shadow-lift lg:grid-cols-4 lg:divide-x [&>div]:border-line max-lg:[&>div:nth-child(-n+2)]:border-b max-lg:[&>div:nth-child(odd)]:border-r">
            {stats.map((stat) => (
              <div key={stat.label} className="px-5 py-6 md:px-8 md:py-8">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-serif text-4xl font-semibold text-burgundy-700 md:text-5xl">{stat.value}</dd>
                <dd className="mt-1.5 text-sm text-muted md:text-[0.9375rem]">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Об университете */}
      <section className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
        <div>
          <div className="rule mb-4" />
          <h2 className="section-title">{dict.home.aboutTitle}</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/85">{tr(config.about, locale)}</p>
          {config.aboutPath && (
            <Link href={`/${locale}/${config.aboutPath}`} className="mt-6 inline-flex items-center gap-1.5 font-semibold text-burgundy-700 hover:underline">
              {dict.home.aboutMore}<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        <ul className="self-center border-t border-line">
          {quick.map(({ href, label, icon: Icon }) => (
            <li key={href} className="border-b border-line">
              <Link href={`/${locale}${href}`} className="group flex items-center gap-4 py-4 font-serif text-lg font-semibold text-burgundy-950 transition-colors hover:text-burgundy-700">
                <Icon className="h-5 w-5 shrink-0 text-burgundy-700" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <ArrowRight className="h-5 w-5 text-burgundy-700 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Факультеты */}
      <section className="container-page pb-16 md:pb-24">
        <SectionHead title={dict.home.facultiesTitle} lead={dict.home.facultiesLead} href={`/${locale}/faculties`} linkLabel={dict.common.allFaculties} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {faculties.slice(0, 4).map((f) => <FacultyCard key={f.id} item={f} locale={locale} />)}
        </div>
      </section>

      {/* Уровни обучения */}
      <section className="bg-burgundy-50 py-16 md:py-24">
        <div className="container-page">
          <SectionHead title={dict.home.degreesTitle} lead={dict.home.degreesLead} href={`/${locale}/programs`} linkLabel={dict.common.allPrograms} />
          <div className="grid gap-6 md:grid-cols-3">
            {degrees.map((d, i) => <DegreeCard key={d.id} item={d} index={i} count={counts.get(d.id) ?? 0} locale={locale} dict={dict} />)}
          </div>
        </div>
      </section>

      {/* Новости и мероприятия */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <SectionHead title={dict.home.newsTitle} href={`/${locale}/news`} linkLabel={dict.common.allNews} />
            {lead && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2"><NewsCard item={lead} locale={locale} large /></div>
                {restNews.slice(0, 2).map((n) => <NewsCard key={n.id} item={n} locale={locale} />)}
              </div>
            )}
          </div>
          <aside>
            <SectionHead title={dict.home.eventsTitle} />
            <div>{upcoming.map((e) => <EventRow key={e.id} item={e} locale={locale} />)}</div>
            <Link href={`/${locale}/events`} className="btn btn-outline mt-6 w-full">{dict.common.allEvents}</Link>
          </aside>
        </div>
      </section>

      {/* Слово ректора */}
      {rector && tr(config.rectorMessage, locale) && (
        <section className="bg-burgundy-800 text-white">
          <div className="container-page grid items-center gap-8 py-14 md:grid-cols-[auto_1fr] md:gap-14 md:py-20">
            <Avatar imageId={rector.person.imageId} name={tr(rector.person.fullName, locale)} className="h-48 w-40 bg-burgundy-700 text-5xl text-white md:h-64 md:w-52" />
            <figure>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-burgundy-200">{dict.home.leaderTitle}</p>
              <blockquote className="mt-4 font-serif text-2xl leading-snug md:text-3xl">«{tr(config.rectorMessage, locale)}»</blockquote>
              <figcaption className="mt-6">
                <Link href={`/${locale}/people/${rector.person.slug}`} className="font-semibold hover:underline">{tr(rector.person.fullName, locale)}</Link>
                <span className="mt-0.5 block text-sm text-burgundy-200">{tr(rector.appointment.position, locale)}</span>
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      {/* Студенческая жизнь */}
      <section className="container-page py-16 md:py-24">
        <SectionHead title={dict.home.orgsTitle} lead={dict.home.orgsLead} href={`/${locale}/student-organizations`} linkLabel={dict.home.allOrgs} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {orgs.map((o) => <OrgCard key={o.id} item={o} locale={locale} />)}
        </div>
      </section>

      {/* Заявка */}
      <section className="bg-burgundy-950 py-16 text-white md:py-24">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl leading-tight md:text-5xl">{dict.home.ctaTitle}</h2>
            <p className="mt-5 text-lg leading-relaxed text-burgundy-100">{dict.home.ctaText}</p>
            {config.admissionsPhone && (
              <a href={`tel:${config.admissionsPhone.replace(/[^\d+]/g, "")}`} className="mt-6 inline-block font-serif text-2xl font-semibold hover:underline">{config.admissionsPhone}</a>
            )}
          </div>
          <div className="relative bg-white p-6 text-ink md:p-8">
            <ApplyForm locale={locale} labels={dict.applyForm} options={applyOptions} compact />
          </div>
        </div>
      </section>
    </>
  );
}
