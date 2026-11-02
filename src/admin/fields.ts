/** Описание полей форм админки. Файл без зависимостей от сервера: его типы нужны и клиентским компонентам. */
export type RelationKey = "faculties" | "departments" | "degrees" | "offices";

export type Field = {
  name: string;
  label: string;
  type:
    | "ltext" | "ltextarea" | "lrich"
    | "text" | "email" | "url" | "number" | "textarea"
    | "datetime" | "checkbox" | "slug" | "path" | "image"
    | "select" | "relation" | "appointments";
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  relation?: RelationKey;
  /** Для slug: из какого многоязычного поля сгенерировать адрес, если он пуст. */
  slugFrom?: string;
};

export type RelationOptions = Partial<Record<RelationKey, { value: string; label: string }[]>>;

export type AppointmentDraft = {
  kind: "LEADERSHIP" | "DEAN" | "TEACHER" | "SPECIALIST";
  position: { kk?: string; ru?: string; en?: string };
  facultyId: string;
  departmentId: string;
  officeId: string;
  isHead: boolean;
};

export type ActionResult = { error?: string; ok?: boolean; message?: string } | null;
