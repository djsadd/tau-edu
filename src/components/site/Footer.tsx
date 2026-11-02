import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/tau-logo-light.png";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getMenu, getSiteConfig } from "@/lib/content";
import { tr } from "@/lib/text";
import { toNavItems } from "./Header";

export async function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [config, menu] = await Promise.all([getSiteConfig(), getMenu("FOOTER")]);
  const columns = toNavItems(menu, locale, dict);
  const socials = [
    ["Instagram", config.instagram],
    ["Facebook", config.facebook],
    ["YouTube", config.youtube],
    ["Telegram", config.telegram],
  ].filter(([, url]) => url);

  return (
    <footer className="bg-burgundy-950 text-white">
      <div className="container-page grid gap-10 py-14 pb-24 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Image src={logo} alt={tr(config.name, locale)} sizes="112px" className="h-auto w-28" />
          <ul className="mt-6 space-y-2.5 text-sm text-burgundy-100">
            {tr(config.address, locale) && <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{tr(config.address, locale)}</li>}
            {config.phone && <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><a className="hover:underline" href={`tel:${config.phone.replace(/[^\d+]/g, "")}`}>{config.phone}</a></li>}
            {config.email && <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><a className="hover:underline" href={`mailto:${config.email}`}>{config.email}</a></li>}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {socials.map(([label, url]) => (
                <li key={label}><a href={url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{label}</a></li>
              ))}
            </ul>
          )}
        </div>
        {columns.map((column) => (
          <div key={column.id}>
            <h2 className="font-serif text-base font-semibold">{column.label}</h2>
            <ul className="mt-4 space-y-2 text-sm text-burgundy-100">
              {column.children.map((item) => (
                <li key={item.id}>
                  {item.external ? (
                    <a className="hover:text-white hover:underline" href={item.href ?? "#"} target={item.newTab ? "_blank" : undefined} rel="noopener noreferrer">{item.label}</a>
                  ) : (
                    <Link className="hover:text-white hover:underline" href={item.href ?? "#"}>{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 text-center text-xs text-burgundy-200 sm:text-right">
          © {new Date().getFullYear()} {tr(config.name, locale)}. {dict.common.rights}
        </div>
      </div>
    </footer>
  );
}
