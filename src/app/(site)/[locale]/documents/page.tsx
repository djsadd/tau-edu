import { Download, FileText, Folder } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Empty } from "@/components/site/Section";
import { getDictionary } from "@/i18n";
import { listedFolder, listedFolders, ServiceError } from "@/lib/services";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { formatBytes, formatDate, isUuid, tr } from "@/lib/text";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMeta(locale, "/documents", dict.documents.title, dict.documents.lead);
}

export default async function DocumentsPage({ params, searchParams }: LocaleParams & { searchParams: Promise<{ folder?: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const folderParam = (await searchParams).folder;
  let listed: Awaited<ReturnType<typeof listedFolder>> | null = null;
  let folders: Awaited<ReturnType<typeof listedFolders>> = [];
  let unavailable = false;
  try {
    if (isUuid(folderParam)) listed = await listedFolder(folderParam);
    if (!folderParam || listed?.folder) folders = await listedFolders(listed?.folder?.id ?? null);
  } catch (error) {
    if (!(error instanceof ServiceError)) throw error;
    unavailable = true;
  }
  const folder = listed?.folder ?? null;
  if (folderParam && !folder && !unavailable) notFound();
  const files = listed?.files ?? [];
  const crumbs = [{ label: dict.common.home, href: `/${locale}` }, { label: dict.documents.title, href: folder ? `/${locale}/documents` : undefined }];
  if (folder) crumbs.push({ label: folder.name, href: undefined });
  return (
    <>
      <PageHero title={folder?.name ?? dict.documents.title} lead={folder ? undefined : dict.documents.lead} crumbs={crumbs} />
      <div className="container-page py-12 md:py-16">
        {folders.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((f) => (
              <Link key={f.id} href={`/${locale}/documents?folder=${f.id}`} className="card flex-row items-center gap-4 p-5 font-serif text-lg font-semibold text-burgundy-950 hover:text-burgundy-700">
                <Folder className="h-7 w-7 shrink-0 text-burgundy-700" aria-hidden="true" />{f.name}
              </Link>
            ))}
          </div>
        )}
        {files.length > 0 ? (
          <ul className="divide-y divide-line border-y border-line">
            {files.map((file) => (
              <li key={file.id}>
                <a href={`/files/${file.id}?download=1`} className="group flex items-center gap-4 py-4 hover:bg-burgundy-50 sm:px-3">
                  <FileText className="h-6 w-6 shrink-0 text-burgundy-700" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-medium group-hover:text-burgundy-700">{tr(file.title, locale) || file.name}</span>
                    <span className="text-sm text-muted">{file.name.split(".").pop()?.toUpperCase()} · {formatBytes(file.size)} · {formatDate(file.createdAt, locale)}</span>
                  </span>
                  <Download className="h-5 w-5 shrink-0 text-burgundy-700" aria-label={dict.common.download} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          folders.length === 0 && <Empty>{unavailable ? dict.common.unavailable : folder ? dict.documents.emptyFolder : dict.common.empty}</Empty>
        )}
      </div>
    </>
  );
}
