"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";

function Links({ locale, className }: { locale: Locale; className: string }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const rest = pathname.replace(/^\/(kk|ru|en)(?=\/|$)/, "");
  return (
    <>
      {LOCALES.map((l) => (
        // Обычная ссылка, а не <Link>: нужна полная перезагрузка, потому что меняется <html lang>.
        <a
          key={l}
          href={`/${l}${rest}${query ? `?${query}` : ""}`}
          hrefLang={LOCALE_LABELS[l].intl}
          lang={LOCALE_LABELS[l].intl}
          title={LOCALE_LABELS[l].name}
          aria-current={l === locale ? "true" : undefined}
          className={`${className} ${l === locale ? "font-bold underline underline-offset-4" : "opacity-80 hover:opacity-100"}`}
        >
          {LOCALE_LABELS[l].short}
        </a>
      ))}
    </>
  );
}

export function LangSwitcher({ locale, className = "px-1.5 py-1" }: { locale: Locale; className?: string }) {
  return (
    <Suspense>
      <Links locale={locale} className={className} />
    </Suspense>
  );
}
