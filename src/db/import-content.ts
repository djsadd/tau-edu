import { and, eq, isNull } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { reindexAll } from "../../services/search/engine";
import { detectMime, writeObject } from "../../services/files/storage";
import { sanitizeRich } from "../lib/sanitize";
import admission from "./content/admission.json";
import { closeDb, getDb } from "./index";
import { mediaFiles, mediaFolders, pages, siteSettings, type Localized } from "./schema";

/**
 * Настоящие тексты раздела «Поступление», перенесённые со старого сайта.
 * Запускать можно повторно: файлы не дублируются, а страницы перечисленных
 * адресов перезаписываются, поэтому правки этих страниц из админки будут заменены.
 */
const db = getDb();

/** Контакты и название со старого сайта. Остальные настройки не меняются. */
const SITE_CONTACTS = {
  name: { kk: "«Туран-Астана» университеті", ru: "Университет «Туран-Астана»", en: "Turan-Astana University" },
  address: { kk: "Астана қ., Ы. Дүкенұлы көшесі, 29", ru: "г. Астана, ул. Ы. Дукенулы, 29", en: "29 Y. Dukenuly Street, Astana" },
  phone: "+7 700 139 51 10",
  admissionsPhone: "+7 700 139 51 10",
  email: "info@tau-edu.kz",
  instagram: "https://www.instagram.com/tau_edu.kz/",
  facebook: "https://www.facebook.com/turan.astana",
  youtube: "https://www.youtube.com/channel/UCqnRq2ISMcTG7HF60n0LXdA",
  telegram: "https://t.me/tau_admission_bot",
};

async function importSiteContacts() {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "site"));
  if (!row) throw new Error("Нет настроек сайта: сначала выполните миграции и наполнение");
  await db.update(siteSettings).set({ value: { ...(row.value as object), ...SITE_CONTACTS } }).where(eq(siteSettings.key, "site"));
}

async function folderId(name: string, listed: boolean) {
  const [existing] = await db.select({ id: mediaFolders.id }).from(mediaFolders)
    .where(and(eq(mediaFolders.name, name), isNull(mediaFolders.parentId)));
  if (existing) return existing.id;
  const [row] = await db.insert(mediaFolders).values({ name, listed, isPublic: true }).returning();
  return row.id;
}

async function importFiles() {
  const dir = path.resolve(process.env.LEGACY_FILES_DIR || "./data/legacy-files");
  const documents = await folderId("Поступление", true);
  const images = await folderId("Изображения сайта", false);
  const ids = new Map<string, string>();
  for (const file of admission.files) {
    const parent = "image" in file && file.image ? images : documents;
    const [existing] = await db.select({ id: mediaFiles.id }).from(mediaFiles)
      .where(and(eq(mediaFiles.folderId, parent), eq(mediaFiles.name, file.name)));
    if (existing) {
      ids.set(file.key, existing.id);
      continue;
    }
    const type = detectMime(file.key);
    if (!type) throw new Error(`Недопустимый тип файла: ${file.key}`);
    const bytes = await readFile(path.join(dir, file.key));
    const storageKey = await writeObject(type.ext, bytes);
    const [row] = await db.insert(mediaFiles).values({
      folderId: parent, name: file.name, storageKey, mime: type.mime, size: bytes.byteLength,
    }).returning();
    ids.set(file.key, row.id);
  }
  return ids;
}

function renderContent(content: Localized, ids: Map<string, string>): Localized {
  const render = (html: string) => sanitizeRich(html.replace(/"file:([^"]+)"/g, (_, key: string) => {
    const id = ids.get(key);
    if (!id) throw new Error(`Нет файла ${key}`);
    return `"/files/${id}"`;
  }));
  return Object.fromEntries(Object.entries(content).map(([locale, html]) => [locale, html ? render(html) : ""]));
}

async function main() {
  await importSiteContacts();
  const ids = await importFiles();
  for (const page of admission.pages) {
    const values = { title: page.title, summary: page.summary, content: renderContent(page.content, ids), published: true };
    await db.insert(pages).values({ path: page.path, ...values })
      .onConflictDoUpdate({ target: pages.path, set: values });
  }
  await reindexAll();
  await closeDb();
  console.log(`Импортировано: страниц ${admission.pages.length}, файлов ${ids.size}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
