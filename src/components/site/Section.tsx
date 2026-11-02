import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHead({ title, lead, href, linkLabel }: { title: string; lead?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="max-w-2xl">
        <div className="rule mb-4" />
        <h2 className="section-title">{title}</h2>
        {lead && <p className="mt-3 text-muted md:text-lg">{lead}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1.5 font-semibold text-burgundy-700 hover:underline">
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-line px-6 py-14 text-center text-muted">{children}</p>;
}

export function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="mt-0.5 text-burgundy-700" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
        <div className="mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({ page, pages, hrefFor, labels }: { page: number; pages: number; hrefFor: (p: number) => string; labels: { previous: string; next: string } }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
      {page > 1 && <Link className="btn btn-outline" href={hrefFor(page - 1)}>{labels.previous}</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={`flex h-11 w-11 items-center justify-center border text-sm font-semibold ${p === page ? "border-burgundy-700 bg-burgundy-700 text-white" : "border-line hover:border-burgundy-700"}`}
        >
          {p}
        </Link>
      ))}
      {page < pages && <Link className="btn btn-outline" href={hrefFor(page + 1)}>{labels.next}</Link>}
    </nav>
  );
}
