import "server-only";
import { and, asc, count, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import {
  appointments,
  degrees,
  departments,
  events,
  faculties,
  menuItems,
  news,
  offices,
  pages,
  persons,
  programs,
  siteSettings,
  studentOrgs,
  type Localized,
} from "@/db/schema";
import { SECTIONS, type SectionKey } from "./sections";

/* ---------- Настройки ---------- */

export type SiteConfig = {
  name: Localized;
  shortName: string;
  tagline: Localized;
  address: Localized;
  phone: string;
  admissionsPhone: string;
  email: string;
  heroTitle: Localized;
  heroSubtitle: Localized;
  heroImageId: string | null;
  about: Localized;
  aboutPath: string;
  rectorMessage: Localized;
  stat1Value: string; stat1Label: Localized;
  stat2Value: string; stat2Label: Localized;
  stat3Value: string; stat3Label: Localized;
  stat4Value: string; stat4Label: Localized;
  instagram: string;
  facebook: string;
  youtube: string;
  telegram: string;
};

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "site"));
  return (row?.value ?? {}) as unknown as SiteConfig;
});

/* ---------- Меню ---------- */

export type MenuNode = {
  id: string;
  label: Localized;
  sectionKey: SectionKey | null;
  href: string | null;
  external: boolean;
  openInNewTab: boolean;
  children: MenuNode[];
};

export const getMenu = cache(async (location: "HEADER" | "FOOTER"): Promise<MenuNode[]> => {
  const rows = await db
    .select({ item: menuItems, pagePath: pages.path, pagePublished: pages.published })
    .from(menuItems)
    .leftJoin(pages, eq(menuItems.pageId, pages.id))
    .where(and(eq(menuItems.location, location), eq(menuItems.visible, true)))
    .orderBy(asc(menuItems.sortOrder));

  const nodes = new Map<string, MenuNode & { parentId: string | null }>();
  for (const { item, pagePath, pagePublished } of rows) {
    if (item.kind === "PAGE" && (!pagePath || !pagePublished)) continue;
    const sectionKey = item.kind === "SECTION" ? (item.sectionKey as SectionKey) : null;
    const href =
      item.kind === "SECTION" && sectionKey && sectionKey in SECTIONS
        ? SECTIONS[sectionKey]
        : item.kind === "PAGE"
          ? `/${pagePath}`
          : item.kind === "URL"
            ? item.url
            : null;
    nodes.set(item.id, {
      id: item.id,
      parentId: item.parentId,
      label: item.label,
      sectionKey,
      href,
      external: item.kind === "URL" && /^https?:/i.test(item.url ?? ""),
      openInNewTab: item.openInNewTab,
      children: [],
    });
  }
  const roots: MenuNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else if (!node.parentId) roots.push(node);
  }
  return roots.filter((n) => n.href !== null || n.children.length > 0);
});

/* ---------- Новости и мероприятия ---------- */

export const PAGE_SIZE = 9;

export async function listNews(page = 1, facultyId?: string, limit = PAGE_SIZE) {
  const where = and(eq(news.published, true), facultyId ? eq(news.facultyId, facultyId) : undefined);
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(news).where(where).orderBy(desc(news.featured), desc(news.publishedAt)).limit(limit).offset((page - 1) * limit),
    db.select({ total: count() }).from(news).where(where),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function latestNews(limit: number) {
  return db.select().from(news).where(eq(news.published, true)).orderBy(desc(news.publishedAt)).limit(limit);
}

export async function getNews(slug: string) {
  const [row] = await db.select().from(news).where(and(eq(news.slug, slug), eq(news.published, true)));
  return row ?? null;
}

export async function listEvents(when: "upcoming" | "past", limit = 24, facultyId?: string) {
  const now = new Date();
  const where = and(
    eq(events.published, true),
    when === "upcoming" ? gte(events.startsAt, now) : lt(events.startsAt, now),
    facultyId ? eq(events.facultyId, facultyId) : undefined,
  );
  return db
    .select()
    .from(events)
    .where(where)
    .orderBy(when === "upcoming" ? asc(events.startsAt) : desc(events.startsAt))
    .limit(limit);
}

export async function getEvent(slug: string) {
  const [row] = await db.select().from(events).where(and(eq(events.slug, slug), eq(events.published, true)));
  return row ?? null;
}

/* ---------- Академическая структура ---------- */

export const listFaculties = cache(async () =>
  db.select().from(faculties).where(eq(faculties.published, true)).orderBy(asc(faculties.sortOrder)),
);

export async function getFaculty(slug: string) {
  const [row] = await db.select().from(faculties).where(and(eq(faculties.slug, slug), eq(faculties.published, true)));
  return row ?? null;
}

export const listDepartments = cache(async () =>
  db
    .select({ department: departments, faculty: faculties })
    .from(departments)
    .innerJoin(faculties, eq(departments.facultyId, faculties.id))
    .where(eq(departments.published, true))
    .orderBy(asc(faculties.sortOrder), asc(departments.sortOrder)),
);

export async function departmentsOfFaculty(facultyId: string) {
  return db
    .select()
    .from(departments)
    .where(and(eq(departments.facultyId, facultyId), eq(departments.published, true)))
    .orderBy(asc(departments.sortOrder));
}

export async function getDepartment(slug: string) {
  const [row] = await db
    .select({ department: departments, faculty: faculties })
    .from(departments)
    .innerJoin(faculties, eq(departments.facultyId, faculties.id))
    .where(and(eq(departments.slug, slug), eq(departments.published, true)));
  return row ?? null;
}

export const listDegrees = cache(async () =>
  db.select().from(degrees).where(eq(degrees.published, true)).orderBy(asc(degrees.sortOrder)),
);

export async function getDegree(slug: string) {
  const [row] = await db.select().from(degrees).where(and(eq(degrees.slug, slug), eq(degrees.published, true)));
  return row ?? null;
}

export async function programCountsByDegree() {
  const rows = await db
    .select({ degreeId: programs.degreeId, total: count() })
    .from(programs)
    .where(eq(programs.published, true))
    .groupBy(programs.degreeId);
  return new Map(rows.map((r) => [r.degreeId, r.total]));
}

export type ProgramFilters = { degreeId?: string; facultyId?: string; departmentId?: string };

export async function listPrograms(filters: ProgramFilters = {}) {
  return db
    .select({ program: programs, degree: degrees, faculty: faculties })
    .from(programs)
    .innerJoin(degrees, eq(programs.degreeId, degrees.id))
    .innerJoin(faculties, eq(programs.facultyId, faculties.id))
    .where(
      and(
        eq(programs.published, true),
        filters.degreeId ? eq(programs.degreeId, filters.degreeId) : undefined,
        filters.facultyId ? eq(programs.facultyId, filters.facultyId) : undefined,
        filters.departmentId ? eq(programs.departmentId, filters.departmentId) : undefined,
      ),
    )
    .orderBy(asc(degrees.sortOrder), asc(programs.sortOrder));
}

export async function getProgram(slug: string) {
  const [row] = await db
    .select({ program: programs, degree: degrees, faculty: faculties, department: departments })
    .from(programs)
    .innerJoin(degrees, eq(programs.degreeId, degrees.id))
    .innerJoin(faculties, eq(programs.facultyId, faculties.id))
    .leftJoin(departments, eq(programs.departmentId, departments.id))
    .where(and(eq(programs.slug, slug), eq(programs.published, true)));
  return row ?? null;
}

/* ---------- Подразделения ---------- */

export async function listOffices(kind?: "DEPARTMENT" | "DIVISION" | "OFFICE" | "CENTER") {
  return db
    .select()
    .from(offices)
    .where(and(eq(offices.published, true), kind ? eq(offices.kind, kind) : undefined))
    .orderBy(asc(offices.sortOrder));
}

export async function getOffice(slug: string) {
  const [row] = await db.select().from(offices).where(and(eq(offices.slug, slug), eq(offices.published, true)));
  if (!row) return null;
  const [parent, children] = await Promise.all([
    row.parentId
      ? db.select().from(offices).where(and(eq(offices.id, row.parentId), eq(offices.published, true))).then((r) => r[0] ?? null)
      : null,
    db.select().from(offices).where(and(eq(offices.parentId, row.id), eq(offices.published, true))).orderBy(asc(offices.sortOrder)),
  ]);
  return { office: row, parent, children };
}

/* ---------- Люди ---------- */

const staffOrder = [desc(appointments.isHead), asc(appointments.sortOrder)] as const;

export async function listLeadership() {
  return db
    .select({ person: persons, appointment: appointments })
    .from(appointments)
    .innerJoin(persons, eq(appointments.personId, persons.id))
    .where(and(eq(appointments.kind, "LEADERSHIP"), eq(persons.published, true)))
    .orderBy(asc(appointments.sortOrder));
}

export async function listTeachers(filters: { facultyId?: string; departmentId?: string } = {}) {
  return db
    .select({ person: persons, appointment: appointments, department: departments })
    .from(appointments)
    .innerJoin(persons, eq(appointments.personId, persons.id))
    .innerJoin(departments, eq(appointments.departmentId, departments.id))
    .where(
      and(
        eq(appointments.kind, "TEACHER"),
        eq(persons.published, true),
        filters.facultyId ? eq(departments.facultyId, filters.facultyId) : undefined,
        filters.departmentId ? eq(appointments.departmentId, filters.departmentId) : undefined,
      ),
    )
    .orderBy(sql`${persons.fullName}->>'ru'`);
}

export async function staffOfDepartment(departmentId: string) {
  return db
    .select({ person: persons, appointment: appointments })
    .from(appointments)
    .innerJoin(persons, eq(appointments.personId, persons.id))
    .where(and(eq(appointments.departmentId, departmentId), eq(persons.published, true)))
    .orderBy(...staffOrder);
}

export async function staffOfOffice(officeId: string) {
  return db
    .select({ person: persons, appointment: appointments })
    .from(appointments)
    .innerJoin(persons, eq(appointments.personId, persons.id))
    .where(and(eq(appointments.officeId, officeId), eq(persons.published, true)))
    .orderBy(...staffOrder);
}

export async function deanOfFaculty(facultyId: string) {
  const [row] = await db
    .select({ person: persons, appointment: appointments })
    .from(appointments)
    .innerJoin(persons, eq(appointments.personId, persons.id))
    .where(and(eq(appointments.facultyId, facultyId), eq(appointments.kind, "DEAN"), eq(persons.published, true)))
    .orderBy(...staffOrder);
  return row ?? null;
}

export async function getPerson(slug: string) {
  const [person] = await db.select().from(persons).where(and(eq(persons.slug, slug), eq(persons.published, true)));
  if (!person) return null;
  const roles = await db
    .select({ appointment: appointments, department: departments, office: offices, faculty: faculties })
    .from(appointments)
    .leftJoin(departments, eq(appointments.departmentId, departments.id))
    .leftJoin(offices, eq(appointments.officeId, offices.id))
    .leftJoin(faculties, eq(appointments.facultyId, faculties.id))
    .where(eq(appointments.personId, person.id))
    .orderBy(asc(appointments.sortOrder));
  return { person, roles };
}

/* ---------- Студенческие объединения ---------- */

export async function listStudentOrgs(limit = 100) {
  return db.select().from(studentOrgs).where(eq(studentOrgs.published, true)).orderBy(asc(studentOrgs.sortOrder)).limit(limit);
}

export async function getStudentOrg(slug: string) {
  const [row] = await db
    .select({ org: studentOrgs, faculty: faculties })
    .from(studentOrgs)
    .leftJoin(faculties, eq(studentOrgs.facultyId, faculties.id))
    .where(and(eq(studentOrgs.slug, slug), eq(studentOrgs.published, true)));
  return row ?? null;
}

/* ---------- Страницы ---------- */

export async function getPage(path: string) {
  const [row] = await db.select().from(pages).where(and(eq(pages.path, path), eq(pages.published, true)));
  return row ?? null;
}
