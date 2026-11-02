import type { Dictionary } from "@/i18n";

/** Встроенные разделы сайта: на них можно ссылаться из пунктов меню. */
export const SECTIONS = {
  home: "",
  news: "/news",
  events: "/events",
  faculties: "/faculties",
  departments: "/departments",
  teachers: "/teachers",
  offices: "/offices",
  programs: "/programs",
  degrees: "/degrees",
  leadership: "/leadership",
  studentOrgs: "/student-organizations",
  documents: "/documents",
  apply: "/apply",
  search: "/search",
} as const satisfies Record<keyof Dictionary["sections"], string>;

export type SectionKey = keyof typeof SECTIONS;

/** Первые сегменты адресов, которые нельзя занять пользовательской страницей. */
export const RESERVED_PATHS = new Set<string>([
  ...Object.values(SECTIONS).map((p) => p.replace("/", "")).filter(Boolean),
  "people",
  "admin",
  "api",
  "files",
]);
