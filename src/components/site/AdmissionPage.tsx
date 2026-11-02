import { ArrowRight, Award, BookOpen, Building2, Globe, GraduationCap, Microscope, Palette, School, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { ADMISSION_PAGES, ADMISSION_PATHWAYS, ADMISSION_ROOT } from "@/lib/admission";
import { listPagesByPaths } from "@/lib/content";
import { splitRichSections } from "@/lib/rich-sections";
import { tr } from "@/lib/text";
import type { Localized } from "@/db/schema";
import { ApplyButton } from "./ApplyModal";
import { PageHero } from "./PageHero";

const ICONS: Record<(typeof ADMISSION_PATHWAYS)[number]["icon"], LucideIcon> = {
  school: School,
  college: Building2,
  creative: Palette,
  second: Award,
  master: BookOpen,
  doctorate: Microscope,
  foreign: Globe,
};

type Props = {
  path: string;
  page: { title: Localized; summary: Localized; content: Localized };
  locale: Locale;
  dict: Dictionary;
};

/** Оформление страниц раздела «Поступление»: навигация по разделу, содержание страницы и обращение к комиссии. */
export async function AdmissionPage({ path, page, locale, dict }: Props) {
  const labels = dict.admission;
  const pathwayPaths = ADMISSION_PATHWAYS.map((p) => p.path as string);
  const rows = await listPagesByPaths([...ADMISSION_PAGES, ...pathwayPaths]);
  const byPath = new Map(rows.map((row) => [row.path, row]));
  const href = (target: string) => `/${locale}/${target}`;
  const isRoot = path === ADMISSION_ROOT;
  const title = tr(page.title, locale);

  const mainLinks = ADMISSION_PAGES.flatMap((p) => {
    const row = byPath.get(p);
    return row ? [{ path: p, title: tr(row.title, locale) }] : [];
  });
  const pathways = ADMISSION_PATHWAYS.flatMap((p) => {
    const row = byPath.get(p.path);
    return row ? [{ ...p, title: tr(row.title, locale), summary: tr(row.summary, locale) }] : [];
  });

  const { intro, sections } = splitRichSections(tr(page.content, locale));
  const crumbs = [
    { label: dict.common.home, href: `/${locale}` },
    ...(!isRoot ? [{ label: labels.sectionNav, href: href(ADMISSION_ROOT) }] : []),
    { label: title },
  ];
  const navLink = (target: string, label: string) => (
    <Link
      key={target}
      href={href(target)}
      aria-current={target === path ? "page" : undefined}
      className={`block border-l-2 px-3 py-1.5 text-sm transition-colors ${target === path ? "border-burgundy-700 font-semibold text-burgundy-800" : "border-line text-muted hover:border-burgundy-300 hover:text-burgundy-800"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHero
        title={title}
        lead={tr(page.summary, locale)}
        crumbs={crumbs}
        aside={<ApplyButton className="btn btn-inverse sm:hidden">{dict.common.apply}</ApplyButton>}
      />

      <nav aria-label={labels.sectionNav} className="border-b border-line lg:hidden">
        <div className="container-page flex gap-2 overflow-x-auto py-3">
          {[...mainLinks, ...pathways].map((item) => (
            <Link
              key={item.path}
              href={href(item.path)}
              aria-current={item.path === path ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border px-3 py-1.5 text-sm ${item.path === path ? "border-burgundy-700 bg-burgundy-700 text-white" : "border-line text-ink"}`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </nav>

      <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
        <div className="min-w-0">
          {intro && <div className="rich rich-intro" dangerouslySetInnerHTML={{ __html: intro }} />}

          {isRoot && pathways.length > 0 && (
            <section className="rich-section" aria-labelledby="pathways">
              <h2 id="pathways" className="rich-heading">{labels.pathways}</h2>
              <p className="mb-6 text-muted">{labels.pathwaysLead}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {pathways.map((item) => {
                  const Icon = ICONS[item.icon];
                  return (
                    <Link key={item.path} href={href(item.path)} className="card group flex-row gap-4 p-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-burgundy-50 text-burgundy-700" aria-hidden="true">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-serif text-lg font-semibold leading-snug text-burgundy-950 group-hover:text-burgundy-700">{item.title}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted">{item.summary}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="rich rich-section scroll-mt-32" dangerouslySetInnerHTML={{ __html: section.html }} />
          ))}

          <section className="mt-12 flex flex-wrap items-center justify-between gap-5 bg-burgundy-900 p-6 text-white md:p-8">
            <div className="max-w-md">
              <h2 className="font-serif text-2xl">{labels.questions}</h2>
              <p className="mt-2 text-burgundy-100">{labels.questionsLead}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ApplyButton className="btn btn-inverse">{dict.common.apply}</ApplyButton>
              <Link href={href("admission/contacts")} className="btn btn-ghost-inverse">
                {labels.contacts}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100vh-9rem)] space-y-7 overflow-y-auto pb-2">
            {sections.length > 1 && (
              <nav aria-label={labels.onThisPage}>
                <h2 className="eyebrow mb-3">{labels.onThisPage}</h2>
                <ul className="space-y-1.5 text-sm">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="block leading-snug text-muted hover:text-burgundy-800">{section.title}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <nav aria-label={labels.sectionNav}>
              <h2 className="eyebrow mb-3 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                {labels.sectionNav}
              </h2>
              {mainLinks.map((item) => navLink(item.path, item.title))}
              <h3 className="mb-2 mt-5 text-xs font-semibold text-muted">{labels.pathways}</h3>
              {pathways.map((item) => navLink(item.path, item.title))}
            </nav>
          </div>
        </aside>
      </div>
    </>
  );
}
