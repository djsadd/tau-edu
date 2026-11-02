import { sql } from "drizzle-orm";
import {
  boolean,
  type AnyPgColumn,
  check,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Значение на трёх языках. Хранится в JSONB, чтобы одна запись = одна сущность. */
export type Localized = { kk?: string; ru?: string; en?: string };

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

const id = () => uuid("id").primaryKey().defaultRandom();
const ltext = (name: string) => jsonb(name).$type<Localized>().notNull().default({});
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
const publishable = {
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
};

/* ---------- Пользователи админки ---------- */

export const userRole = pgEnum("user_role", ["ADMIN", "EDITOR"]);

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("EDITOR"),
  ...timestamps,
});

/* ---------- Файловая система ---------- */

export const mediaFolders = pgTable(
  "media_folders",
  {
    id: id(),
    name: text("name").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => mediaFolders.id, { onDelete: "restrict" }),
    /** Файлы приватной папки отдаются только авторизованным сотрудникам. */
    isPublic: boolean("is_public").notNull().default(true),
    /** Показывать папку в публичном разделе «Документы». */
    listed: boolean("listed").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("media_folders_parent_idx").on(t.parentId)],
);

export const mediaFiles = pgTable(
  "media_files",
  {
    id: id(),
    folderId: uuid("folder_id").references(() => mediaFolders.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    /** Имя объекта в хранилище. Генерируется сервером и не зависит от имени файла. */
    storageKey: text("storage_key").notNull().unique(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    title: ltext("title"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("media_files_folder_idx").on(t.folderId)],
);

const imageRef = () => uuid("image_id").references(() => mediaFiles.id, { onDelete: "set null" });

/* ---------- Академическая структура ---------- */

export const faculties = pgTable("faculties", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: ltext("name"),
  summary: ltext("summary"),
  content: ltext("content"),
  imageId: imageRef(),
  phone: text("phone"),
  email: text("email"),
  location: ltext("location"),
  ...publishable,
  ...timestamps,
});

/** Кафедра всегда принадлежит факультету. */
export const departments = pgTable(
  "departments",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => faculties.id, { onDelete: "restrict" }),
    name: ltext("name"),
    summary: ltext("summary"),
    content: ltext("content"),
    imageId: imageRef(),
    phone: text("phone"),
    email: text("email"),
    location: ltext("location"),
    ...publishable,
    ...timestamps,
  },
  (t) => [index("departments_faculty_idx").on(t.facultyId)],
);

/** Уровень образования: бакалавриат, магистратура, докторантура. */
export const degrees = pgTable("degrees", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: ltext("name"),
  awarded: ltext("awarded"),
  duration: ltext("duration"),
  summary: ltext("summary"),
  content: ltext("content"),
  imageId: imageRef(),
  ...publishable,
  ...timestamps,
});

export const programs = pgTable(
  "programs",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    code: text("code"),
    degreeId: uuid("degree_id")
      .notNull()
      .references(() => degrees.id, { onDelete: "restrict" }),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => faculties.id, { onDelete: "restrict" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    name: ltext("name"),
    summary: ltext("summary"),
    content: ltext("content"),
    durationYears: integer("duration_years"),
    credits: integer("credits"),
    languages: ltext("languages"),
    studyForm: ltext("study_form"),
    imageId: imageRef(),
    ...publishable,
    ...timestamps,
  },
  (t) => [
    index("programs_degree_idx").on(t.degreeId),
    index("programs_faculty_idx").on(t.facultyId),
    index("programs_department_idx").on(t.departmentId),
  ],
);

/* ---------- Отделы, департаменты, офисы ---------- */

export const officeKind = pgEnum("office_kind", ["DEPARTMENT", "DIVISION", "OFFICE", "CENTER"]);

export const offices = pgTable(
  "offices",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    kind: officeKind("kind").notNull().default("OFFICE"),
    /** Иерархия: отдел может входить в департамент. */
    parentId: uuid("parent_id").references((): AnyPgColumn => offices.id, { onDelete: "set null" }),
    name: ltext("name"),
    summary: ltext("summary"),
    content: ltext("content"),
    imageId: imageRef(),
    phone: text("phone"),
    email: text("email"),
    location: ltext("location"),
    workingHours: ltext("working_hours"),
    ...publishable,
    ...timestamps,
  },
  (t) => [index("offices_parent_idx").on(t.parentId)],
);

/* ---------- Люди и должности ---------- */

/** Один человек — одна запись: ректор может быть и преподавателем, специалист — совместителем. */
export const persons = pgTable("persons", {
  id: id(),
  slug: text("slug").notNull().unique(),
  fullName: ltext("full_name"),
  academicDegree: ltext("academic_degree"),
  academicTitle: ltext("academic_title"),
  bio: ltext("bio"),
  imageId: imageRef(),
  email: text("email"),
  phone: text("phone"),
  location: ltext("location"),
  orcid: text("orcid"),
  ...publishable,
  ...timestamps,
});

/**
 * Связь человека со структурой университета.
 * Роль определяет, куда он относится: кафедра, отдел, факультет или ректорат.
 */
export const appointmentKind = pgEnum("appointment_kind", [
  "LEADERSHIP",
  "DEAN",
  "TEACHER",
  "SPECIALIST",
]);

export const appointments = pgTable(
  "appointments",
  {
    id: id(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    kind: appointmentKind("kind").notNull(),
    position: ltext("position"),
    facultyId: uuid("faculty_id").references(() => faculties.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "cascade" }),
    officeId: uuid("office_id").references(() => offices.id, { onDelete: "cascade" }),
    /** Руководитель подразделения: заведующий кафедрой, начальник отдела. */
    isHead: boolean("is_head").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("appointments_person_idx").on(t.personId),
    index("appointments_department_idx").on(t.departmentId),
    index("appointments_office_idx").on(t.officeId),
    index("appointments_faculty_idx").on(t.facultyId),
    index("appointments_kind_idx").on(t.kind),
    check(
      "appointments_target_check",
      sql`(${t.kind} = 'TEACHER' AND ${t.departmentId} IS NOT NULL AND ${t.officeId} IS NULL AND ${t.facultyId} IS NULL)
       OR (${t.kind} = 'SPECIALIST' AND ${t.officeId} IS NOT NULL AND ${t.departmentId} IS NULL AND ${t.facultyId} IS NULL)
       OR (${t.kind} = 'DEAN' AND ${t.facultyId} IS NOT NULL AND ${t.departmentId} IS NULL AND ${t.officeId} IS NULL)
       OR (${t.kind} = 'LEADERSHIP' AND ${t.facultyId} IS NULL AND ${t.departmentId} IS NULL AND ${t.officeId} IS NULL)`,
    ),
  ],
);

/* ---------- Публикации ---------- */

export const news = pgTable(
  "news",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: ltext("title"),
    summary: ltext("summary"),
    content: ltext("content"),
    imageId: imageRef(),
    facultyId: uuid("faculty_id").references(() => faculties.id, { onDelete: "set null" }),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    published: boolean("published").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("news_published_at_idx").on(t.publishedAt), index("news_faculty_idx").on(t.facultyId)],
);

export const events = pgTable(
  "events",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: ltext("title"),
    summary: ltext("summary"),
    content: ltext("content"),
    imageId: imageRef(),
    facultyId: uuid("faculty_id").references(() => faculties.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    location: ltext("location"),
    registrationUrl: text("registration_url"),
    published: boolean("published").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("events_starts_at_idx").on(t.startsAt), index("events_faculty_idx").on(t.facultyId)],
);

export const studentOrgs = pgTable(
  "student_orgs",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: ltext("name"),
    category: ltext("category"),
    summary: ltext("summary"),
    content: ltext("content"),
    imageId: imageRef(),
    facultyId: uuid("faculty_id").references(() => faculties.id, { onDelete: "set null" }),
    leaderName: ltext("leader_name"),
    email: text("email"),
    socialUrl: text("social_url"),
    ...publishable,
    ...timestamps,
  },
  (t) => [index("student_orgs_faculty_idx").on(t.facultyId)],
);

/* ---------- Конструктор: страницы и меню ---------- */

export const pages = pgTable("pages", {
  id: id(),
  /** Адрес страницы, может быть вложенным: about/history */
  path: text("path").notNull().unique(),
  title: ltext("title"),
  summary: ltext("summary"),
  content: ltext("content"),
  imageId: imageRef(),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const menuLocation = pgEnum("menu_location", ["HEADER", "FOOTER"]);
export const menuItemKind = pgEnum("menu_item_kind", ["GROUP", "SECTION", "PAGE", "URL"]);

export const menuItems = pgTable(
  "menu_items",
  {
    id: id(),
    location: menuLocation("location").notNull().default("HEADER"),
    parentId: uuid("parent_id").references((): AnyPgColumn => menuItems.id, { onDelete: "cascade" }),
    kind: menuItemKind("kind").notNull().default("SECTION"),
    label: ltext("label"),
    /** Для SECTION — ключ раздела из lib/sections.ts */
    sectionKey: text("section_key"),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }),
    url: text("url"),
    openInNewTab: boolean("open_in_new_tab").notNull().default(false),
    visible: boolean("visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("menu_items_location_idx").on(t.location, t.sortOrder)],
);

/* ---------- Заявки «Хочу поступить» ---------- */

export const applicationStatus = pgEnum("application_status", [
  "NEW",
  "IN_PROGRESS",
  "ENROLLED",
  "DECLINED",
]);

export const applications = pgTable(
  "applications",
  {
    id: id(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    degreeId: uuid("degree_id").references(() => degrees.id, { onDelete: "set null" }),
    programId: uuid("program_id").references(() => programs.id, { onDelete: "set null" }),
    message: text("message"),
    locale: text("locale").notNull(),
    status: applicationStatus("status").notNull().default("NEW"),
    notes: text("notes"),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("applications_status_idx").on(t.status, t.createdAt)],
);

/* ---------- Настройки сайта ---------- */

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* ---------- Единый поисковый индекс (сайт + ИИ-помощник) ---------- */

export const searchDocuments = pgTable(
  "search_documents",
  {
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    /** Путь без префикса языка: /news/slug */
    url: text("url").notNull(),
    tsv: tsvector("tsv").generatedAlwaysAs(
      sql`setweight(to_tsvector(CASE locale WHEN 'ru' THEN 'russian'::regconfig WHEN 'en' THEN 'english'::regconfig ELSE 'simple'::regconfig END, title), 'A')
       || setweight(to_tsvector(CASE locale WHEN 'ru' THEN 'russian'::regconfig WHEN 'en' THEN 'english'::regconfig ELSE 'simple'::regconfig END, summary), 'B')
       || setweight(to_tsvector(CASE locale WHEN 'ru' THEN 'russian'::regconfig WHEN 'en' THEN 'english'::regconfig ELSE 'simple'::regconfig END, body), 'C')`,
    ),
  },
  (t) => [
    primaryKey({ columns: [t.entityType, t.entityId, t.locale] }),
    index("search_documents_tsv_idx").using("gin", t.tsv),
    index("search_documents_title_trgm_idx").using("gin", sql`title gin_trgm_ops`),
    index("search_documents_locale_idx").on(t.locale),
  ],
);
