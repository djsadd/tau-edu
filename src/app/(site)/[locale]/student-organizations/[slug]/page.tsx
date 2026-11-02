import { ExternalLink, Mail, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/site/Cover";
import { PageHero } from "@/components/site/PageHero";
import { Prose } from "@/components/site/Prose";
import { InfoRow } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { getStudentOrg } from "@/lib/content";
import { pageMeta, resolveLocale, type SlugParams } from "@/lib/page";
import { tr } from "@/lib/text";

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const row = await getStudentOrg((await params).slug);
  return row ? pageMeta(locale, `/student-organizations/${row.org.slug}`, tr(row.org.name, locale), tr(row.org.summary, locale)) : {};
}

export default async function OrgPage({ params }: SlugParams) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const row = await getStudentOrg((await params).slug);
  if (!row) notFound();
  const { org, faculty } = row;
  const socialUrl = org.socialUrl && /^https?:\/\//i.test(org.socialUrl) ? org.socialUrl : null;
  return (
    <>
      <PageHero title={tr(org.name, locale)} lead={tr(org.summary, locale)} crumbs={[{ label: dict.common.home, href: `/${locale}` }, { label: dict.sections.studentOrgs, href: `/${locale}/student-organizations` }, { label: tr(org.name, locale) }]} />
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_20rem]">
        <div>
          {org.imageId && <div className="mb-8 aspect-[16/9] overflow-hidden"><Cover imageId={org.imageId} seed={org.slug} alt={tr(org.name, locale)} priority /></div>}
          <Prose html={tr(org.content, locale)} />
        </div>
        <aside className="h-fit border-t-4 border-burgundy-700 bg-burgundy-50 p-5">
          {tr(org.leaderName, locale) && <InfoRow icon={<User className="h-4 w-4" />} label={dict.orgs.leader}>{tr(org.leaderName, locale)}</InfoRow>}
          {org.email && <InfoRow icon={<Mail className="h-4 w-4" />} label={dict.common.email}><a className="hover:underline" href={`mailto:${org.email}`}>{org.email}</a></InfoRow>}
          {faculty && (
            <div className="border-t border-burgundy-200 py-3 text-sm">
              <Link href={`/${locale}/faculties/${faculty.slug}`} className="font-semibold text-burgundy-800 hover:underline">{tr(faculty.name, locale)}</Link>
            </div>
          )}
          {socialUrl && <a href={socialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-3 w-full">{dict.orgs.join}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}
        </aside>
      </div>
    </>
  );
}
