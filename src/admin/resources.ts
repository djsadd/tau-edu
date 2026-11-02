import type { PgTable } from "drizzle-orm/pg-core";
import { degrees, departments, events, faculties, news, offices, pages, persons, programs, studentOrgs } from "@/db/schema";
import type { SearchEntity } from "@/lib/services";
import type { Field } from "./fields";

export type Resource = {
  key: SearchEntity;
  title: string;
  singular: string;
  table: PgTable;
  titleField: string;
  fields: Field[];
  /** Колонки таблицы в списке, кроме заголовка. */
  columns?: { name: string; label: string; relation?: "faculties" | "degrees" }[];
  orderBy: { column: string; desc?: boolean };
  publicPath: (row: Record<string, unknown>) => string;
};

const publish: Field[] = [
  { name: "published", label: "Опубликовано", type: "checkbox" },
  { name: "sortOrder", label: "Порядок сортировки", type: "number", help: "Меньшее число показывается раньше" },
];
const contacts: Field[] = [
  { name: "phone", label: "Телефон", type: "text" },
  { name: "email", label: "Эл. почта", type: "email" },
  { name: "location", label: "Расположение", type: "ltext" },
];
const OFFICE_KINDS = [
  { value: "DEPARTMENT", label: "Департамент" },
  { value: "DIVISION", label: "Отдел" },
  { value: "OFFICE", label: "Офис" },
  { value: "CENTER", label: "Центр" },
];
const image: Field = { name: "imageId", label: "Изображение", type: "image" };

export const RESOURCES: Record<SearchEntity, Resource> = {
  news: {
    key: "news", title: "Новости", singular: "новость", table: news, titleField: "title",
    orderBy: { column: "publishedAt", desc: true },
    columns: [{ name: "publishedAt", label: "Дата" }],
    publicPath: (r) => `/news/${r.slug}`,
    fields: [
      { name: "title", label: "Заголовок", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "title", help: "Сформируется автоматически, если оставить пустым" },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Текст", type: "lrich" },
      image,
      { name: "facultyId", label: "Факультет", type: "relation", relation: "faculties", help: "Новость появится на странице факультета" },
      { name: "publishedAt", label: "Дата публикации", type: "datetime", required: true },
      { name: "featured", label: "Закрепить в начале списка", type: "checkbox" },
      { name: "published", label: "Опубликовано", type: "checkbox" },
    ],
  },
  events: {
    key: "events", title: "Мероприятия", singular: "мероприятие", table: events, titleField: "title",
    orderBy: { column: "startsAt", desc: true },
    columns: [{ name: "startsAt", label: "Начало" }],
    publicPath: (r) => `/events/${r.slug}`,
    fields: [
      { name: "title", label: "Название", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "title" },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Описание", type: "lrich" },
      image,
      { name: "startsAt", label: "Начало", type: "datetime", required: true },
      { name: "endsAt", label: "Окончание", type: "datetime" },
      { name: "location", label: "Место проведения", type: "ltext" },
      { name: "registrationUrl", label: "Ссылка на регистрацию", type: "url" },
      { name: "facultyId", label: "Факультет", type: "relation", relation: "faculties" },
      { name: "published", label: "Опубликовано", type: "checkbox" },
    ],
  },
  pages: {
    key: "pages", title: "Страницы", singular: "страницу", table: pages, titleField: "title",
    orderBy: { column: "path" },
    columns: [{ name: "path", label: "Адрес" }],
    publicPath: (r) => `/${r.path}`,
    fields: [
      { name: "title", label: "Заголовок", type: "ltext", required: true },
      { name: "path", label: "Адрес страницы", type: "path", required: true, help: "Латиница, можно вложенный: about/history. После создания добавьте страницу в меню." },
      { name: "summary", label: "Подзаголовок", type: "ltextarea" },
      { name: "content", label: "Содержимое", type: "lrich" },
      image,
      { name: "published", label: "Опубликовано", type: "checkbox" },
    ],
  },
  faculties: {
    key: "faculties", title: "Факультеты", singular: "факультет", table: faculties, titleField: "name",
    orderBy: { column: "sortOrder" },
    publicPath: (r) => `/faculties/${r.slug}`,
    fields: [
      { name: "name", label: "Название", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "name" },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Описание", type: "lrich" },
      image, ...contacts, ...publish,
    ],
  },
  departments: {
    key: "departments", title: "Кафедры", singular: "кафедру", table: departments, titleField: "name",
    orderBy: { column: "sortOrder" },
    columns: [{ name: "facultyId", label: "Факультет", relation: "faculties" }],
    publicPath: (r) => `/departments/${r.slug}`,
    fields: [
      { name: "name", label: "Название", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "name" },
      { name: "facultyId", label: "Факультет", type: "relation", relation: "faculties", required: true },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Описание", type: "lrich" },
      image, ...contacts, ...publish,
    ],
  },
  programs: {
    key: "programs", title: "Образовательные программы", singular: "программу", table: programs, titleField: "name",
    orderBy: { column: "sortOrder" },
    columns: [{ name: "code", label: "Шифр" }, { name: "degreeId", label: "Степень", relation: "degrees" }, { name: "facultyId", label: "Факультет", relation: "faculties" }],
    publicPath: (r) => `/programs/${r.slug}`,
    fields: [
      { name: "name", label: "Название", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "name" },
      { name: "code", label: "Шифр", type: "text" },
      { name: "degreeId", label: "Академическая степень", type: "relation", relation: "degrees", required: true },
      { name: "facultyId", label: "Факультет", type: "relation", relation: "faculties", required: true },
      { name: "departmentId", label: "Выпускающая кафедра", type: "relation", relation: "departments" },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Описание", type: "lrich" },
      { name: "durationYears", label: "Срок обучения, лет", type: "number" },
      { name: "credits", label: "Кредиты", type: "number" },
      { name: "languages", label: "Языки обучения", type: "ltext" },
      { name: "studyForm", label: "Форма обучения", type: "ltext" },
      image, ...publish,
    ],
  },
  degrees: {
    key: "degrees", title: "Академические степени", singular: "степень", table: degrees, titleField: "name",
    orderBy: { column: "sortOrder" },
    publicPath: (r) => `/degrees/${r.slug}`,
    fields: [
      { name: "name", label: "Название", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "name" },
      { name: "awarded", label: "Присуждаемая степень", type: "ltext" },
      { name: "duration", label: "Срок обучения", type: "ltext" },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Описание", type: "lrich" },
      image, ...publish,
    ],
  },
  offices: {
    key: "offices", title: "Отделы и департаменты", singular: "подразделение", table: offices, titleField: "name",
    orderBy: { column: "sortOrder" },
    columns: [{ name: "kind", label: "Тип" }],
    publicPath: (r) => `/offices/${r.slug}`,
    fields: [
      { name: "name", label: "Название", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "name" },
      { name: "kind", label: "Тип", type: "select", options: OFFICE_KINDS, required: true },
      { name: "parentId", label: "Входит в", type: "relation", relation: "offices" },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Описание", type: "lrich" },
      image, ...contacts,
      { name: "workingHours", label: "Часы работы", type: "ltext" },
      ...publish,
    ],
  },
  persons: {
    key: "persons", title: "Сотрудники", singular: "сотрудника", table: persons, titleField: "fullName",
    orderBy: { column: "sortOrder" },
    publicPath: (r) => `/people/${r.slug}`,
    fields: [
      { name: "fullName", label: "ФИО", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "fullName" },
      { name: "appointments", label: "Должности и подразделения", type: "appointments", help: "Определяют, где человек показывается на сайте: на кафедре, в отделе, на факультете или в руководстве" },
      { name: "academicDegree", label: "Учёная степень", type: "ltext" },
      { name: "academicTitle", label: "Учёное звание", type: "ltext" },
      { name: "bio", label: "Биография", type: "lrich" },
      { name: "imageId", label: "Фотография", type: "image" },
      { name: "email", label: "Эл. почта", type: "email" },
      { name: "phone", label: "Телефон", type: "text" },
      { name: "location", label: "Кабинет", type: "ltext" },
      { name: "orcid", label: "ORCID", type: "text" },
      ...publish,
    ],
  },
  studentOrgs: {
    key: "studentOrgs", title: "Студенческие объединения", singular: "объединение", table: studentOrgs, titleField: "name",
    orderBy: { column: "sortOrder" },
    columns: [{ name: "facultyId", label: "Факультет", relation: "faculties" }],
    publicPath: (r) => `/student-organizations/${r.slug}`,
    fields: [
      { name: "name", label: "Название", type: "ltext", required: true },
      { name: "slug", label: "Адрес (slug)", type: "slug", slugFrom: "name" },
      { name: "category", label: "Категория", type: "ltext" },
      { name: "summary", label: "Краткое описание", type: "ltextarea" },
      { name: "content", label: "Описание", type: "lrich" },
      image,
      { name: "facultyId", label: "Факультет", type: "relation", relation: "faculties" },
      { name: "leaderName", label: "Руководитель", type: "ltext" },
      { name: "email", label: "Эл. почта", type: "email" },
      { name: "socialUrl", label: "Ссылка на сообщество", type: "url" },
      ...publish,
    ],
  },
};

export function getResource(key: string): Resource | null {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key as SearchEntity] : null;
}

const statFields = [1, 2, 3, 4].flatMap<Field>((n) => [
  { name: `stat${n}Value`, label: `Показатель ${n}: значение`, type: "text" },
  { name: `stat${n}Label`, label: `Показатель ${n}: подпись`, type: "ltext" },
]);

export const SETTINGS_FIELDS: Field[] = [
  { name: "name", label: "Полное название университета", type: "ltext", required: true },
  { name: "shortName", label: "Короткое название", type: "text", required: true },
  { name: "tagline", label: "Подпись под логотипом", type: "ltext" },
  { name: "heroTitle", label: "Главная: заголовок", type: "ltext" },
  { name: "heroSubtitle", label: "Главная: подзаголовок", type: "ltextarea" },
  { name: "heroImageId", label: "Главная: фоновое фото", type: "image", help: "Если не выбрано, показывается фирменный рисунок" },
  ...statFields,
  { name: "about", label: "Главная: текст «Об университете»", type: "ltextarea" },
  { name: "aboutPath", label: "Ссылка «Подробнее об университете»", type: "text", help: "Адрес страницы, например about" },
  { name: "rectorMessage", label: "Слово ректора", type: "ltextarea" },
  { name: "address", label: "Адрес", type: "ltext" },
  { name: "phone", label: "Телефон", type: "text" },
  { name: "admissionsPhone", label: "Телефон приёмной комиссии", type: "text" },
  { name: "email", label: "Эл. почта", type: "email" },
  { name: "instagram", label: "Instagram", type: "url" },
  { name: "facebook", label: "Facebook", type: "url" },
  { name: "youtube", label: "YouTube", type: "url" },
  { name: "telegram", label: "Telegram", type: "url" },
];
