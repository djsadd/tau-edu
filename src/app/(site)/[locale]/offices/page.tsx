import type { Metadata } from "next";
import Link from "next/link";
import { OfficeCard } from "@/components/site/Cards";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listOffices } from "@/lib/content";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";

const KINDS = ["DEPARTMENT", "DIVISION", "OFFICE", "CENTER"] as const;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMeta(locale, "/offices", getDictionary(locale).sections.offices);
}

export default async function OfficesPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ kind?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const raw = (await searchParams).kind;
  const kind = KINDS.find((k) => k === raw);
  const rows = await listOffices(kind);
  const pill = (active: boolean) => `border px-4 py-2 text-sm font-semibold ${active ? "border-burgundy-700 bg-burgundy-700 text-white" : "border-line text-ink hover:border-burgundy-700"}`;
  return (
    <>
      <PageHero title={dict.sections.offices} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.offices }]} />
      <div className="container-page py-12 md:py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href={`/${locale}/offices`} className={pill(!kind)}>{dict.structure.allKinds}</Link>
          {KINDS.map((k) => <Link key={k} href={`/${locale}/offices?kind=${k}`} className={pill(kind === k)}>{dict.structure.kinds[k]}</Link>)}
        </div>
        {rows.length === 0 ? <Empty>{dict.common.empty}</Empty> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rows.map((o) => <OfficeCard key={o.id} item={o} locale={locale} dict={dict} />)}</div>
        )}
      </div>
    </>
  );
}
