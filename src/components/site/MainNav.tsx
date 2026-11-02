"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export type NavItem = { id: string; label: string; href: string | null; external: boolean; newTab: boolean; children: NavItem[] };

function NavLink({ item, className, onClick, children }: { item: NavItem; className: string; onClick?: () => void; children?: ReactNode }) {
  const body = children ?? item.label;
  if (item.external) {
    return <a href={item.href ?? "#"} className={className} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}>{body}</a>;
  }
  return <Link href={item.href ?? "#"} className={className} onClick={onClick} target={item.newTab ? "_blank" : undefined}>{body}</Link>;
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="hidden items-stretch xl:flex">
      {items.map((item) => {
        const active = item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        const childActive = item.children.some((c) => c.href && pathname.startsWith(c.href));
        const base = `flex h-full items-center gap-1 border-b-2 px-3 text-[0.9375rem] font-semibold transition-colors hover:text-burgundy-700 ${active || childActive ? "border-burgundy-700 text-burgundy-700" : "border-transparent text-ink"}`;
        if (!item.children.length) {
          return <li key={item.id}><NavLink item={item} className={base} /></li>;
        }
        return (
          <li key={item.id} className="group relative">
            {item.href ? (
              <NavLink item={item} className={base}>
                {item.label}
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" aria-hidden="true" />
              </NavLink>
            ) : (
              <button type="button" aria-haspopup="true" className={base}>
                {item.label}
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" aria-hidden="true" />
              </button>
            )}
            <div className="invisible absolute left-0 top-full z-40 min-w-72 translate-y-1 border-t-2 border-burgundy-700 bg-white py-2 opacity-0 shadow-lift transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {item.children.map((child) => (
                <NavLink key={child.id} item={child} className="block px-5 py-2.5 text-[0.9375rem] hover:bg-burgundy-50 hover:text-burgundy-700" />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileNav({ items, labels, footer }: { items: NavItem[]; labels: { menu: string; close: string }; footer: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button type="button" aria-label={labels.menu} aria-expanded={open} onClick={() => setOpen(true)} className="flex h-11 w-11 items-center justify-center text-burgundy-800">
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-label={labels.menu}>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-serif text-xl font-semibold text-burgundy-800">{labels.menu}</span>
            <button type="button" aria-label={labels.close} onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center text-burgundy-800">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <ul className="flex-1 px-5 py-2">
            {items.map((item) => (
              <li key={item.id} className="border-b border-line">
                {item.children.length ? (
                  <details className="group">
                    <summary className="flex list-none items-center justify-between py-3.5 font-semibold [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <ChevronDown className="h-5 w-5 text-burgundy-700 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="pb-3 pl-3">
                      {item.href && <NavLink item={item} className="block py-2 text-muted" onClick={() => setOpen(false)} />}
                      {item.children.map((child) => (
                        <NavLink key={child.id} item={child} className="block py-2 text-muted" onClick={() => setOpen(false)} />
                      ))}
                    </div>
                  </details>
                ) : (
                  <NavLink item={item} className="block py-3.5 font-semibold" onClick={() => setOpen(false)} />
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-5">{footer}</div>
        </div>
      )}
    </div>
  );
}
