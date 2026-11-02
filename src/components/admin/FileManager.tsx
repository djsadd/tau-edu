"use client";

import { ChevronRight, Copy, Eye, EyeOff, FileText, Folder, FolderPlus, Globe, Home, Loader2, Lock, Pencil, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { createFolder, deleteFile, deleteFolder, moveFile, renameFile, renameFolder, setFolderFlags } from "@/admin/actions";
import type { Localized } from "@/db/schema";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { formatBytes } from "@/lib/text";
import { ConfirmButton } from "./Forms";
import { uploadFiles } from "./MediaPicker";

type FolderRow = { id: string; name: string; isPublic: boolean; listed: boolean };
type FileRow = { id: string; name: string; mime: string; size: number; title: Localized };

export function FileManager({ folderId, path, folders, files, allFolders, currentFolder }: { folderId: string | null; path: { id: string; name: string }[]; folders: FolderRow[]; files: FileRow[]; allFolders: { id: string; name: string }[]; currentFolder: FolderRow | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [, start] = useTransition();

  async function upload(list: FileList | File[]) {
    if (!list.length) return;
    setUploading(true);
    const result = await uploadFiles(list, folderId);
    setError(result.ok ? null : result.error || "Не удалось загрузить файлы");
    setUploading(false);
    router.refresh();
  }

  function run(action: () => Promise<{ error?: string } | null>) {
    start(async () => {
      const result = await action();
      setError(result?.error ?? null);
      router.refresh();
    });
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files);
  }

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }} onDrop={onDrop} className={`min-h-96 border-2 border-dashed p-4 transition-colors ${dragging ? "border-burgundy-700 bg-burgundy-50" : "border-transparent"}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Путь">
          <Link href="/admin/files" className="flex items-center gap-1 hover:text-burgundy-700"><Home className="h-4 w-4" aria-hidden="true" />Все файлы</Link>
          {path.map((p) => (
            <span key={p.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <Link href={`/admin/files?folder=${p.id}`} className="hover:text-burgundy-700">{p.name}</Link>
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex" onSubmit={(e) => { e.preventDefault(); if (newFolder.trim()) { run(() => createFolder(newFolder, folderId)); setNewFolder(""); } }}>
            <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Новая папка" aria-label="Название новой папки" className="field !w-40 !py-1.5 text-sm" />
            <button className="btn btn-outline !border-l-0 !px-3 !py-1.5" aria-label="Создать папку"><FolderPlus className="h-4 w-4" aria-hidden="true" /></button>
          </form>
          <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="btn btn-primary !py-1.5 text-sm">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}Загрузить
          </button>
          <input ref={input} type="file" multiple className="sr-only" onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }} />
        </div>
      </div>

      {currentFolder && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 border border-line bg-burgundy-50 px-4 py-2.5 text-sm">
          <span className="font-semibold">Настройки папки:</span>
          <label className="flex items-center gap-2"><input key={`public-${currentFolder.isPublic}`} type="checkbox" className="h-4 w-4 accent-burgundy-700" defaultChecked={currentFolder.isPublic} onChange={(e) => run(() => setFolderFlags(currentFolder.id, { isPublic: e.target.checked }))} />Файлы доступны всем по ссылке</label>
          <label className="flex items-center gap-2"><input key={`listed-${currentFolder.listed}`} type="checkbox" className="h-4 w-4 accent-burgundy-700" defaultChecked={currentFolder.listed} onChange={(e) => run(() => setFolderFlags(currentFolder.id, { listed: e.target.checked }))} />Показывать в разделе «Документы»</label>
          <span className="text-xs text-muted">Применяется и к вложенным папкам</span>
        </div>
      )}

      {error && <p role="alert" className="mb-4 border-l-4 border-burgundy-700 bg-burgundy-50 px-3 py-2 text-sm font-medium text-burgundy-800">{error}</p>}

      {folders.length === 0 && files.length === 0 && (
        <p className="py-16 text-center text-muted">Папка пуста. Перетащите файлы сюда или нажмите «Загрузить».</p>
      )}

      {folders.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <div key={folder.id} className="flex items-center gap-3 border border-line bg-white p-3">
              <Folder className="h-7 w-7 shrink-0 text-burgundy-700" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {editingFolder === folder.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); const name = String(new FormData(e.currentTarget).get("name")); run(() => renameFolder(folder.id, name)); setEditingFolder(null); }}>
                    <input name="name" autoFocus defaultValue={folder.name} aria-label="Название папки" onBlur={() => setEditingFolder(null)} className="field !py-1 text-sm" />
                  </form>
                ) : (
                  <Link href={`/admin/files?folder=${folder.id}`} className="block truncate font-medium hover:text-burgundy-700">{folder.name}</Link>
                )}
                <span className="flex items-center gap-2 text-xs text-muted">
                  {folder.isPublic ? <span className="flex items-center gap-1"><Globe className="h-3 w-3" aria-hidden="true" />Публичная</span> : <span className="flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden="true" />Приватная</span>}
                  {folder.listed ? <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" />В «Документах»</span> : <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" aria-hidden="true" />Скрыта</span>}
                </span>
              </div>
              <button type="button" aria-label="Переименовать" onClick={() => setEditingFolder(folder.id)} className="p-1 text-muted hover:text-burgundy-700"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
              <ConfirmButton action={() => deleteFolder(folder.id)} label={<Trash2 className="h-4 w-4" aria-label="Удалить папку" />} confirmLabel="Удалить?" className="p-1 text-sm text-muted hover:text-burgundy-700" />
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-line border-y border-line bg-white">
          {files.map((file) => (
            <li key={file.id} className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-burgundy-50">
                  {file.mime.startsWith("image/") && file.mime !== "image/svg+xml" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/files/${file.id}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : <FileText className="h-5 w-5 text-burgundy-700" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <a href={`/files/${file.id}`} target="_blank" className="block truncate font-medium hover:text-burgundy-700">{file.name}</a>
                  <span className="text-xs text-muted">{formatBytes(file.size)}</span>
                </div>
                <select
                  aria-label="Переместить в папку"
                  value={folderId ?? ""}
                  onChange={(e) => run(() => moveFile(file.id, e.target.value || null))}
                  className="field !w-40 !py-1 text-sm"
                >
                  <option value="">Все файлы</option>
                  {allFolders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${location.origin}/files/${file.id}`);
                    setCopied(file.id);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                  className="flex items-center gap-1 text-sm text-burgundy-700 hover:underline"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />{copied === file.id ? "Скопировано" : "Ссылка"}
                </button>
                <button type="button" onClick={() => setEditing(editing === file.id ? null : file.id)} aria-label="Изменить название" className="p-1 text-muted hover:text-burgundy-700"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                <ConfirmButton action={() => deleteFile(file.id)} label={<Trash2 className="h-4 w-4" aria-label="Удалить файл" />} confirmLabel="Удалить?" className="p-1 text-sm text-muted hover:text-burgundy-700" />
              </div>
              {editing === file.id && (
                <form
                  className="mt-3 grid gap-2 bg-burgundy-50 p-3 md:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const title: Localized = {};
                    for (const l of LOCALES) {
                      const text = String(data.get(l) ?? "").trim();
                      if (text) title[l] = text;
                    }
                    run(() => renameFile(file.id, String(data.get("name")), title));
                    setEditing(null);
                  }}
                >
                  <label className="text-sm md:col-span-2">Имя файла<input name="name" defaultValue={file.name} className="field mt-1 !py-1.5" /></label>
                  {LOCALES.map((l) => (
                    <label key={l} className="text-sm">Название ({LOCALE_LABELS[l].name})<input name={l} defaultValue={file.title[l] ?? ""} className="field mt-1 !py-1.5" /></label>
                  ))}
                  <div className="md:col-span-2"><button className="btn btn-primary !py-1.5 text-sm">Сохранить</button></div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
