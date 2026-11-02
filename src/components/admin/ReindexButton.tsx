"use client";

import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { runReindex } from "@/admin/actions";

export function ReindexButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button type="button" disabled={pending} onClick={() => start(async () => setMessage((await runReindex())?.message ?? null))} className="btn btn-outline !py-1.5 text-sm disabled:opacity-60">
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />Обновить поисковый индекс
      </button>
      {message && <span role="status" className="text-muted">{message}</span>}
    </div>
  );
}
