import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, degrees, departments, faculties, offices, type Localized } from "@/db/schema";
import { tr } from "@/lib/text";
import type { AppointmentDraft, Field, RelationOptions } from "./fields";

const named = (rows: { id: string; name: Localized }[]) => rows.map((r) => ({ value: r.id, label: tr(r.name, "ru") }));

export async function loadRelations(fields: Field[]): Promise<RelationOptions> {
  const needed = new Set(fields.filter((f) => f.type === "relation").map((f) => f.relation!));
  if (fields.some((f) => f.type === "appointments")) ["faculties", "departments", "offices"].forEach((k) => needed.add(k as never));
  const result: RelationOptions = {};
  if (needed.has("faculties")) result.faculties = named(await db.select({ id: faculties.id, name: faculties.name }).from(faculties).orderBy(asc(faculties.sortOrder)));
  if (needed.has("departments")) result.departments = named(await db.select({ id: departments.id, name: departments.name }).from(departments).orderBy(asc(departments.sortOrder)));
  if (needed.has("degrees")) result.degrees = named(await db.select({ id: degrees.id, name: degrees.name }).from(degrees).orderBy(asc(degrees.sortOrder)));
  if (needed.has("offices")) result.offices = named(await db.select({ id: offices.id, name: offices.name }).from(offices).orderBy(asc(offices.sortOrder)));
  return result;
}

/** Значение для поля datetime-local по времени Астаны. */
export function toDateTimeLocal(value: unknown) {
  if (!value) return "";
  const date = new Date(value as string);
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
  return parts.replace(" ", "T");
}

export function toFormValues(fields: Field[], row: Record<string, unknown>) {
  const values: Record<string, unknown> = { ...row };
  for (const field of fields) if (field.type === "datetime") values[field.name] = toDateTimeLocal(row[field.name]);
  return values;
}

export async function loadAppointments(personId: string): Promise<AppointmentDraft[]> {
  const rows = await db.select().from(appointments).where(eq(appointments.personId, personId)).orderBy(asc(appointments.sortOrder));
  return rows.map((r) => ({
    kind: r.kind,
    position: r.position,
    facultyId: r.facultyId ?? "",
    departmentId: r.departmentId ?? "",
    officeId: r.officeId ?? "",
    isHead: r.isHead,
  }));
}

export async function personIdsWithKind(kind: AppointmentDraft["kind"]) {
  return db.select({ id: appointments.personId }).from(appointments).where(eq(appointments.kind, kind));
}

