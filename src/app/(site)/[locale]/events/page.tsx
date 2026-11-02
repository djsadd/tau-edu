import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listEvents } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMeta(locale, "/events", getDictionary(locale).sections.events);
}

export default async function EventsPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ when?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const when = (await searchParams).when === "past" ? "past" : "upcoming";
  const rows = await listEvents(when, 48);
  const tabs = [["upcoming", dict.events.upcoming], ["past", dict.events.past]] as const;
  return (
    <>
      <PageHero title={dict.sections.events} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.events }]} />
      <div className="container-page py-12 md:py-16">
        <div className="mb-8 flex gap-1 border-b border-line">
          {tabs.map(([key, label]) => (
            <Link key={key} href={`/${locale}/events${key === "past" ? "?when=past" : ""}`} aria-current={when === key ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-3 font-semibold ${when === key ? "border-burgundy-700 text-burgundy-700" : "border-transparent text-muted hover:text-burgundy-700"}`}>
              {label}
            </Link>
          ))}
        </div>
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rows.map((e) => <EventCard key={e.id} item={e} locale={locale} />)}</div>
        )}
      </div>
    </>
  );
}
