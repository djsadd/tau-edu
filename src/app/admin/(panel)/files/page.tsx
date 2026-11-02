import { FileManager } from "@/components/admin/FileManager";
import { browseFiles } from "@/lib/services";
import { isUuid } from "@/lib/text";

export const metadata = { title: "Файлы" };

export default async function FilesPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const raw = (await searchParams).folder;
  const folderId = isUuid(raw) ? raw : null;
  const { folders: all, files, currentId: effectiveId } = await browseFiles(folderId);
  const current = all.find((f) => f.id === effectiveId) ?? null;
  const path: { id: string; name: string }[] = [];
  for (let node = current; node; node = all.find((f) => f.id === node!.parentId) ?? null) path.unshift({ id: node.id, name: node.name });

  const toRow = (f: (typeof all)[number]) => ({ id: f.id, name: f.name, isPublic: f.isPublic, listed: f.listed });
  return (
    <>
      <h1 className="mb-1 text-3xl text-burgundy-950">Файлы</h1>
      <p className="mb-4 text-sm text-muted">Изображения для страниц и документы. Папки с отметкой «Показывать в разделе Документы» появляются на сайте.</p>
      <div className="bg-white">
        <FileManager
          folderId={effectiveId}
          path={path}
          currentFolder={current ? toRow(current) : null}
          folders={all.filter((f) => f.parentId === effectiveId).map(toRow)}
          allFolders={all.map((f) => ({ id: f.id, name: f.name }))}
          files={files.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size, title: f.title }))}
        />
      </div>
    </>
  );
}
