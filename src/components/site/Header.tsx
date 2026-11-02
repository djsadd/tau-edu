import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { getMenu, getSiteConfig, type MenuNode } from "@/lib/content";
import { tr } from "@/lib/text";
import { ApplyButton } from "./ApplyModal";
import { LangSwitcher } from "./LangSwitcher";
import { Crest } from "./Logo";
import { DesktopNav, MobileNav, type NavItem } from "./MainNav";
import { SearchDialog } from "./SearchDialog";

export function toNavItems(nodes: MenuNode[], locale: Locale, dict: Dictionary): NavItem[] {
  return nodes.map((node) => ({
    id: node.id,
    label: tr(node.label, locale) || (node.sectionKey ? dict.sections[node.sectionKey] : ""),
    href: node.href === null ? null : node.external ? node.href : `/${locale}${node.href}`,
    external: node.external,
    newTab: node.openInNewTab,
    children: toNavItems(node.children, locale, dict),
  }));
}

export async function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [config, menu] = await Promise.all([getSiteConfig(), getMenu("HEADER")]);
  const items = toNavItems(menu, locale, dict);
  const searchLabels = { search: dict.common.search, placeholder: dict.common.searchPlaceholder, nothing: dict.search.nothing };

  return (
    <header className="sticky top-0 z-30 bg-white shadow-[0_1px_0_var(--color-line)]">
      <div className="bg-burgundy-900 text-sm text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4">
          <div className="hidden items-center gap-5 sm:flex">
            {config.phone && (
              <a href={`tel:${config.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />{config.phone}
              </a>
            )}
            {config.email && (
              <a href={`mailto:${config.email}`} className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />{config.email}
              </a>
            )}
          </div>
          <nav aria-label={dict.common.language} className="ml-auto flex items-center gap-1 text-xs tracking-wide">
            <LangSwitcher locale={locale} />
          </nav>
        </div>
      </div>
      <div className="container-page flex h-[4.5rem] items-stretch justify-between gap-4">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3">
          <Crest className="h-12 w-[2.6rem] shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block font-serif text-2xl font-bold tracking-wide text-burgundy-800">{config.shortName}</span>
            <span className="block max-w-52 truncate text-xs text-muted">{tr(config.tagline, locale)}</span>
          </span>
        </Link>
        <nav aria-label={dict.common.menu} className="flex items-stretch">
          <DesktopNav items={items} />
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <SearchDialog locale={locale} labels={searchLabels} closeLabel={dict.common.close} types={dict.search.types} triggerClassName="flex h-11 w-11 items-center justify-center text-burgundy-800 hover:bg-burgundy-50" />
          <ApplyButton className="btn btn-primary hidden whitespace-nowrap sm:inline-flex">{dict.common.apply}</ApplyButton>
          <MobileNav
            items={items}
            labels={{ menu: dict.common.menu, close: dict.common.close }}
            footer={<ApplyButton className="btn btn-primary w-full">{dict.common.apply}</ApplyButton>}
          />
        </div>
      </div>
    </header>
  );
}
