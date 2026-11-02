import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inter, serif } from "@/app/fonts";
import "@/app/globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Управление сайтом", template: "%s — Управление сайтом" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
