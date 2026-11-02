/** Страницы раздела «Поступление». Тексты хранятся в базе, здесь только порядок и значки. */
export const ADMISSION_ROOT = "admission";

export const ADMISSION_PAGES = [ADMISSION_ROOT, "admission/tuition-grants", "admission/why-tau", "admission/dormitory", "admission/contacts"];

export const ADMISSION_PATHWAYS = [
  { path: "admission/school", icon: "school" },
  { path: "admission/college", icon: "college" },
  { path: "admission/creative", icon: "creative" },
  { path: "admission/second-degree", icon: "second" },
  { path: "admission/master", icon: "master" },
  { path: "admission/doctorate", icon: "doctorate" },
  { path: "admission/foreign", icon: "foreign" },
] as const;

export function isAdmissionPath(path: string) {
  return path === ADMISSION_ROOT || path.startsWith(`${ADMISSION_ROOT}/`);
}
