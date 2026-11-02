import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

export function PageHero({ title, lead, crumbs, aside }: { title: string; lead?: string; crumbs: Crumb[]; aside?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-burgundy-900 text-white">
      <svg className="absolute inset-y-0 right-0 hidden h-full w-1/2 md:block" viewBox="0 0 600 300" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <g fill="none" stroke="#fff" strokeOpacity="0.1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M${i * 80 + 20} 300V150a30 30 0 0 1 60 0v150`} />
          ))}
        </g>
      </svg>
      <div className="container-page relative py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-sm text-burgundy-200">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-white hover:underline">{crumb.label}</Link>
              ) : (
                <span className="text-white/90" aria-current="page">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl leading-tight md:text-5xl">{title}</h1>
            {lead && <p className="mt-4 text-lg leading-relaxed text-burgundy-100">{lead}</p>}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}
