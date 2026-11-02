"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { ApplyForm, type ApplyOptions } from "./ApplyForm";

const ApplyContext = createContext<(programId?: string) => void>(() => undefined);

export function ApplyProvider({ locale, labels, closeLabel, options, children }: { locale: Locale; labels: Dictionary["applyForm"]; closeLabel: string; options: ApplyOptions; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<{ key: number; programId?: string } | null>(null);

  const open = useCallback((programId?: string) => {
    setState((s) => ({ key: (s?.key ?? 0) + 1, programId }));
  }, []);

  useEffect(() => {
    if (state) dialog.current?.showModal();
  }, [state]);

  return (
    <ApplyContext.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="apply-title"
        onClick={(e) => { if (e.target === dialog.current) dialog.current.close(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl overflow-visible bg-transparent backdrop:bg-burgundy-950/60 backdrop:backdrop-blur-sm"
      >
        <div className="animate-pop max-h-[90dvh] overflow-y-auto border-t-4 border-burgundy-700 bg-white p-6 shadow-lift md:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="apply-title" className="text-2xl text-burgundy-950 md:text-3xl">{labels.title}</h2>
              <p className="mt-1.5 text-muted">{labels.lead}</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} aria-label={closeLabel} className="-mr-1 p-1 text-muted hover:text-burgundy-700">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          {state && <ApplyForm key={state.key} locale={locale} labels={labels} options={options} initialProgramId={state.programId} />}
        </div>
      </dialog>
    </ApplyContext.Provider>
  );
}

export function ApplyButton({ children, programId, className = "btn btn-primary" }: { children: ReactNode; programId?: string; className?: string }) {
  const open = useContext(ApplyContext);
  return <button type="button" onClick={() => open(programId)} className={className}>{children}</button>;
}
