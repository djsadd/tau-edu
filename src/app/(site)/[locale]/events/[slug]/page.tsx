import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cover } from "@/components/site/Cover";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getEvent } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { formatDateTime, tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const item = await getEvent((await params).slug);
  return item ? pageMeta(locale, `/events/${item.slug}`, tr(item.title, locale), tr(item.summary, locale)) : {};
}

export default async function EventPage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const item = await getEvent((await params).slug);
  if (!item) notFound();
  const registrationUrl = item.registrationUrl && /^https?:\/\//i.test(item.registrationUrl) ? item.registrationUrl : null;
  return (
    <>
      <PageHero title={tr(item.title, locale)} lead={tr(item.summary, locale)} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.events, href: `/${locale}/events` }, { label: tr(item.title, locale) }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_20rem]">
        <div>
          {item.imageId && <div className="mb-8 aspect-[16/9] overflow-hidden"><Cover imageId={item.imageId} seed={item.slug} alt={tr(item.title, locale)} priority /></div>}
          <Prose html={tr(item.content, locale)} />
        </div>
        <aside className="h-fit border-t-4 border-burgundy-700 bg-burgundy-50 p-5 lg:sticky lg:top-32">
          <InfoRow icon={<CalendarDays className="h-5 w-5" />} label={dict.events.date}>
            {formatDateTime(item.startsAt, locale)}
            {item.endsAt && <span className="block text-sm text-muted">— {formatDateTime(item.endsAt, locale)}</span>}
          </InfoRow>
          {tr(item.location, locale) && <InfoRow icon={<MapPin className="h-5 w-5" />} label={dict.events.place}>{tr(item.location, locale)}</InfoRow>}
          {registrationUrl && (
            <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-3 w-full">
              {dict.events.register}<ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </aside>
      </div>
    </>
  );
}
