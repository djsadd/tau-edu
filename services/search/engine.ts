import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  degrees,
  departments,
  events,
  faculties,
  news,
  offices,
  pages,
  persons,
  programs,
  searchDocuments,
  studentOrgs,
  type Localized,
} from "@/db/schema";
import { LOCALES, type Locale } from "@/i18n/config";
import { stripHtml, tr } from "@/lib/text";

export type SearchEntity =
  | "news" | "events" | "faculties" | "departments" | "programs"
  | "degrees" | "offices" | "persons" | "studentOrgs" | "pages";

export type SearchHit = {
  entityType: SearchEntity;
  entityId: string;
  title: string;
  summary: string;
  body: string;
  url: string;
};

const TS_CONFIG: Record<Locale, string> = { ru: "russian", en: "english", kk: "simple" };

/** mode "all" — для строки поиска, "any" — для вопросов на естественном языке в чате. */
export async function searchSite(
  query: string,
  locale: Locale,
  { limit = 30, mode = "all" }: { limit?: number; mode?: "all" | "any" } = {},
): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 200);
  let tokens: string[] = q.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (mode === "any") tokens = tokens.filter((t) => t.length >= 3);
  if (!tokens.length) return [];
  const tsQuery = tokens.map((t) => `${t}:*`).join(mode === "all" ? " & " : " | ");
  const config = sql.raw(`'${TS_CONFIG[locale]}'`);

  const result = await db.execute(sql`
    SELECT entity_type AS "entityType", entity_id AS "entityId", title, summary, body, url
    FROM search_documents
    WHERE locale = ${locale}
      AND (tsv @@ to_tsquery(${config}, ${tsQuery}) OR word_similarity(${q}, title) > 0.45)
    ORDER BY ts_rank(tsv, to_tsquery(${config}, ${tsQuery})) + word_similarity(${q}, title) DESC
    LIMIT ${limit}
  `);
  return result.rows as unknown as SearchHit[];
}

type Doc = { title: Localized; summary?: Localized; body?: Localized; url: string };

function rows(entityType: SearchEntity, entityId: string, doc: Doc) {
  return LOCALES.map((locale) => ({
    entityType,
    entityId,
    locale,
    title: tr(doc.title, locale),
    summary: stripHtml(tr(doc.summary, locale)),
    body: stripHtml(tr(doc.body, locale)),
    url: doc.url,
  }));
}

export async function writeIndex(entityType: SearchEntity, entityId: string, doc: Doc | null) {
  await db
    .delete(searchDocuments)
    .where(and(eq(searchDocuments.entityType, entityType), eq(searchDocuments.entityId, entityId)));
  if (doc) await db.insert(searchDocuments).values(rows(entityType, entityId, doc));
}

/** Для Человека в индекс попадают его должности — так он находится и по ним. */
async function personDoc(id: string): Promise<Doc | null> {
  const [person] = await db.select().from(persons).where(eq(persons.id, id));
  if (!person || !person.published) return null;
  const rows = await db.select().from(appointments).where(eq(appointments.personId, id));
  const summary: Localized = {};
  for (const locale of LOCALES) {
    summary[locale] = rows.map((r) => tr(r.position, locale)).filter(Boolean).join(", ");
  }
  return { title: person.fullName, summary, body: person.bio, url: `/people/${person.slug}` };
}

type Row = { published: boolean; slug?: string; path?: string; [k: string]: unknown };

const BUILDERS = {
  news: { table: news, titleKey: "title", base: "/news" },
  events: { table: events, titleKey: "title", base: "/events" },
  faculties: { table: faculties, titleKey: "name", base: "/faculties" },
  departments: { table: departments, titleKey: "name", base: "/departments" },
  programs: { table: programs, titleKey: "name", base: "/programs" },
  degrees: { table: degrees, titleKey: "name", base: "/degrees" },
  offices: { table: offices, titleKey: "name", base: "/offices" },
  studentOrgs: { table: studentOrgs, titleKey: "name", base: "/student-organizations" },
  pages: { table: pages, titleKey: "title", base: "" },
} as const;

async function buildDoc(type: SearchEntity, id: string): Promise<Doc | null> {
  if (type === "persons") return personDoc(id);
  const b = BUILDERS[type];
  const [row] = (await db.select().from(b.table as typeof news).where(eq((b.table as typeof news).id, id))) as unknown as Row[];
  if (!row || !row.published) return null;
  return {
    title: row[b.titleKey] as Localized,
    summary: row.summary as Localized,
    body: row.content as Localized,
    url: type === "pages" ? `/${row.path}` : `${b.base}/${row.slug}`,
  };
}

export async function reindexEntity(type: SearchEntity, id: string) {
  await writeIndex(type, id, await buildDoc(type, id));
}

/** Индекс заменяется одной транзакцией, поэтому поиск не видит его пустым или собранным наполовину. */
export async function reindexAll() {
  const all: ReturnType<typeof rows> = [];
  const collect = async (type: SearchEntity, ids: { id: string }[]) => {
    for (const { id } of ids) {
      const doc = await buildDoc(type, id);
      if (doc) all.push(...rows(type, id, doc));
    }
  };
  for (const type of Object.keys(BUILDERS) as (keyof typeof BUILDERS)[]) {
    await collect(type, await db.select({ id: (BUILDERS[type].table as typeof news).id }).from(BUILDERS[type].table as typeof news));
  }
  await collect("persons", await db.select({ id: persons.id }).from(persons));
  await db.transaction(async (tx) => {
    await tx.delete(searchDocuments);
    if (all.length) await tx.insert(searchDocuments).values(all);
  });
}
