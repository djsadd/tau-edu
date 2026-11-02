"use client";

import { Loader2, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Hit = { entityType: keyof Dictionary["search"]["types"]; title: string; summary: string; url: string };

export function SearchDialog({ locale, labels, closeLabel, types, triggerClassName }: { locale: Locale; labels: { search: string; placeholder: string; nothing: string }; closeLabel: string; types: Dictionary["search"]["types"]; triggerClassName?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`, { signal: controller.signal });
        if (response.ok) setHits((await response.json()).hits);
      } catch {
        // Запрос отменён следующим вводом.
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" aria-label={labels.search} onClick={() => dialog.current?.showModal()} className={triggerClassName}>
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        aria-label={labels.search}
        onClick={(e) => { if (e.target === dialog.current) close(); }}
        className="mx-auto mt-[8vh] w-[calc(100%-2rem)] max-w-2xl bg-transparent backdrop:bg-burgundy-950/60 backdrop:backdrop-blur-sm"
      >
        <div className="animate-pop bg-white shadow-lift">
          <form
            role="search"
            className="flex items-center gap-3 border-b-2 border-burgundy-700 px-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                close();
                router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
          >
            {loading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-burgundy-700" aria-hidden="true" /> : <Search className="h-5 w-5 shrink-0 text-burgundy-700" aria-hidden="true" />}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.placeholder}
              aria-label={labels.placeholder}
              className="min-w-0 flex-1 bg-transparent py-4 text-lg outline-none placeholder:text-muted"
            />
            <button type="button" onClick={close} aria-label={closeLabel} className="p-1 text-muted hover:text-burgundy-700">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
          {hits && (
            <ul className="max-h-[60dvh] overflow-y-auto py-1">
              {hits.length === 0 && <li className="px-5 py-8 text-center text-muted">{labels.nothing}</li>}
              {hits.map((hit) => (
                <li key={`${hit.entityType}${hit.url}`}>
                  <Link href={`/${locale}${hit.url}`} onClick={close} className="block px-5 py-3 hover:bg-burgundy-50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-burgundy-700">{types[hit.entityType]}</span>
                    <span className="mt-0.5 block font-serif text-[1.0625rem] font-semibold text-burgundy-950">{hit.title}</span>
                    {hit.summary && <span className="mt-0.5 line-clamp-1 block text-sm text-muted">{hit.summary}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
