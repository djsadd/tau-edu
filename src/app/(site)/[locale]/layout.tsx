import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inter, serif } from "@/app/fonts";
import "@/app/globals.css";
import { ApplyProvider } from "@/components/site/ApplyModal";
import { ChatWidget } from "@/components/site/ChatWidget";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getDictionary } from "@/i18n";
import { getSiteConfig, listDegrees, listPrograms } from "@/lib/content";
import { resolveLocale, siteUrl } from "@/lib/page";
import { tr } from "@/lib/text";

// Контент меняется из админки и должен сразу появляться на сайте.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const config = await getSiteConfig();
  const name = tr(config.name, locale);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: name, template: `%s — ${config.shortName}` },
    description: tr(config.tagline, locale),
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const [degrees, programs] = await Promise.all([listDegrees(), listPrograms()]);
  const options = {
    degrees: degrees.map((d) => ({ id: d.id, name: tr(d.name, locale) })),
    programs: programs.map(({ program }) => ({ id: program.id, name: tr(program.name, locale), degreeId: program.degreeId })),
  };

  return (
    <html lang={locale} className={`${inter.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">{dict.common.skipToContent}</a>
        <ApplyProvider locale={locale} labels={dict.applyForm} closeLabel={dict.common.close} options={options}>
          <Header locale={locale} dict={dict} />
          <main id="main" className="flex-1">{children}</main>
          <Footer locale={locale} dict={dict} />
          <ChatWidget locale={locale} labels={dict.chat} closeLabel={dict.common.close} />
        </ApplyProvider>
      </body>
    </html>
  );
}
