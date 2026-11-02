"use client";

import { ChevronRight, FileText, Folder, Home, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type MediaItem = { id: string; name: string; mime: string; size: number };
export type FolderItem = { id: string; name: string };
type Listing = { folders: FolderItem[]; files: MediaItem[]; path: FolderItem[] };

export async function uploadFiles(files: FileList | File[], folderId: string | null) {
  const body = new FormData();
  for (const file of Array.from(files)) body.append("files", file);
  if (folderId) body.append("folderId", folderId);
  const response = await fetch("/api/admin/files", { method: "POST", body });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, error: data.error as string | undefined, files: (data.files ?? []) as MediaItem[] };
}

export function MediaPicker({ open, onClose, onPick, imagesOnly = true }: { open: boolean; onClose: () => void; onPick: (file: MediaItem) => void; imagesOnly?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string | null) => {
    setBusy(true);
    const query = new URLSearchParams();
    if (id) query.set("folder", id);
    if (imagesOnly) query.set("images", "1");
    const response = await fetch(`/api/admin/files?${query}`);
    if (response.ok) setListing(await response.json());
    setBusy(false);
  }, [imagesOnly]);

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      load(folderId);
    } else {
      dialog.current?.close();
    }
  }, [open, folderId, load]);

  return (
    <dialog ref={dialog} onClose={onClose} className="m-auto h-[80dvh] w-[calc(100%-2rem)] max-w-3xl backdrop:bg-burgundy-950/50">
      {open && (
        <div className="flex h-full flex-col bg-white">
          <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-lg text-burgundy-950">Выбор файла</h2>
            <button type="button" onClick={onClose} aria-label="Закрыть" className="p-1 text-muted hover:text-burgundy-700"><X className="h-5 w-5" aria-hidden="true" /></button>
          </header>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-2.5 text-sm">
            <nav className="flex flex-wrap items-center gap-1" aria-label="Путь">
              <button type="button" onClick={() => setFolderId(null)} className="flex items-center gap-1 hover:text-burgundy-700"><Home className="h-4 w-4" aria-hidden="true" />Все файлы</button>
              {listing?.path.map((p) => (
                <span key={p.id} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  <button type="button" onClick={() => setFolderId(p.id)} className="hover:text-burgundy-700">{p.name}</button>
                </span>
              ))}
            </nav>
            <label className="btn btn-outline cursor-pointer !px-3 !py-1.5 text-sm">
              <Upload className="h-4 w-4" aria-hidden="true" />Загрузить
              <input
                type="file"
                className="sr-only"
                multiple
                accept={imagesOnly ? "image/png,image/jpeg,image/webp,image/gif,image/avif" : undefined}
                onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  setBusy(true);
                  const result = await uploadFiles(e.target.files, folderId);
                  setError(result.ok ? null : result.error || "Не удалось загрузить");
                  e.target.value = "";
                  await load(folderId);
                }}
              />
            </label>
          </div>
          {error && <p role="alert" className="bg-burgundy-50 px-5 py-2 text-sm text-burgundy-800">{error}</p>}
          <div className="flex-1 overflow-y-auto p-5">
            {busy && !listing && <Loader2 className="mx-auto h-6 w-6 animate-spin text-burgundy-700" aria-hidden="true" />}
            {listing && !listing.folders.length && !listing.files.length && <p className="py-10 text-center text-muted">Здесь пока нет файлов. Загрузите первый.</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {listing?.folders.map((f) => (
                <button key={f.id} type="button" onClick={() => setFolderId(f.id)} className="flex aspect-square flex-col items-center justify-center gap-2 border border-line p-2 text-center text-sm hover:border-burgundy-700">
                  <Folder className="h-9 w-9 text-burgundy-700" aria-hidden="true" /><span className="line-clamp-2">{f.name}</span>
                </button>
              ))}
              {listing?.files.map((f) => (
                <button key={f.id} type="button" onClick={() => onPick(f)} title={f.name} className="group flex aspect-square flex-col overflow-hidden border border-line text-left hover:border-burgundy-700">
                  {f.mime.startsWith("image/") && f.mime !== "image/svg+xml" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/files/${f.id}`} alt="" loading="lazy" className="min-h-0 flex-1 object-cover" />
                  ) : (
                    <span className="flex min-h-0 flex-1 items-center justify-center bg-burgundy-50"><FileText className="h-9 w-9 text-burgundy-700" aria-hidden="true" /></span>
                  )}
                  <span className="truncate px-2 py-1 text-xs">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
