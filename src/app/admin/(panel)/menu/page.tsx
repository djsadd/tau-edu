import { asc } from "drizzle-orm";
import { MenuEditor, type MenuRow } from "@/components/admin/MenuEditor";
import { db } from "@/db";
import { menuItems, pages } from "@/db/schema";
import { getDictionary } from "@/i18n";
import { SECTIONS, type SectionKey } from "@/lib/sections";
import { tr } from "@/lib/text";

export const metadata = { title: "Меню" };

export default async function MenuPage() {
  const dict = getDictionary("ru");
  const [items, pageRows] = await Promise.all([
    db.select().from(menuItems).orderBy(asc(menuItems.sortOrder)),
    db.select({ id: pages.id, title: pages.title, path: pages.path }).from(pages).orderBy(asc(pages.path)),
  ]);
  const sections = (Object.keys(SECTIONS) as SectionKey[]).map((k) => ({ value: k, label: dict.sections[k] }));
  const pageOptions = pageRows.map((p) => ({ value: p.id, label: `${tr(p.title, "ru")} (/${p.path})` }));
  const rows = (location: "HEADER" | "FOOTER"): MenuRow[] =>
    items
      .filter((i) => i.location === location)
      .map((i) => ({
        id: i.id, parentId: i.parentId, kind: i.kind, label: i.label, sectionKey: i.sectionKey, pageId: i.pageId, url: i.url,
        openInNewTab: i.openInNewTab, visible: i.visible,
        displayLabel: tr(i.label, "ru") || (i.sectionKey ? dict.sections[i.sectionKey as SectionKey] : "") || "Без названия",
      }));
  return (
    <>
      <h1 className="mb-1 text-3xl text-burgundy-950">Меню сайта</h1>
      <p className="mb-6 text-sm text-muted">Добавляйте разделы, созданные страницы и ссылки. Вложенные пункты становятся выпадающим списком.</p>
      <div className="space-y-10">
        <MenuEditor title="Главное меню" location="HEADER" rows={rows("HEADER")} sections={sections} pages={pageOptions} />
        <MenuEditor title="Меню в подвале" location="FOOTER" rows={rows("FOOTER")} sections={sections} pages={pageOptions} />
      </div>
    </>
  );
}
