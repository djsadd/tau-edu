"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export default function NotFound() {
  const { locale } = useParams<{ locale: string }>();
  const current = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const { common } = getDictionary(current);
  return (
    <div className="container-page py-24 text-center">
      <p className="font-serif text-7xl font-semibold text-burgundy-200">404</p>
      <h1 className="mt-4 text-3xl text-burgundy-950">{common.notFoundTitle}</h1>
      <p className="mx-auto mt-3 max-w-lg text-muted">{common.notFoundText}</p>
      <Link href={`/${current}`} className="btn btn-primary mt-8">{common.toHome}</Link>
    </div>
  );
}
