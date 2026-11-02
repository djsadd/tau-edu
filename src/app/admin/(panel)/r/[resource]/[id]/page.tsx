import { eq, getTableColumns } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveResource } from "@/admin/actions";
import { loadAppointments, loadRelations, toFormValues } from "@/admin/data";
import { getResource } from "@/admin/resources";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { db } from "@/db";
import { appointments, persons, type Localized } from "@/db/schema";
import { isUuid, tr } from "@/lib/text";

/** Сотрудники подразделения прямо на его странице: специалист добавляется в отдел в один клик. */
async function StaffPanel({ title, kind, param, id, column }: { title: string; kind: string; param: string; id: string; column: PgColumn }) {
  const rows = await db
    .select({ personId: persons.id, name: persons.fullName, position: appointments.position, isHead: appointments.isHead })
    .from(appointments)
    .innerJoin(persons, eq(appointments.personId, persons.id))
    .where(eq(column, id));
  return (
    <section className="mt-6 border border-line bg-white p-4 md:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl text-burgundy-950">{title}</h2>
        <Link href={`/admin/r/persons/new?kind=${kind}&${param}=${id}`} className="btn btn-outline !py-1.5 text-sm"><Plus className="h-4 w-4" aria-hidden="true" />Добавить</Link>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted">Пока никого нет. Существующего сотрудника можно добавить через его карточку, поле «Должности и подразделения».</p> : (
        <ul className="divide-y divide-line text-sm">
          {rows.map((r) => (
            <li key={r.personId} className="flex flex-wrap justify-between gap-2 py-2">
              <Link href={`/admin/r/persons/${r.personId}`} className="font-medium hover:text-burgundy-700">{tr(r.name, "ru")}</Link>
              <span className="text-muted">{tr(r.position as Localized, "ru")}{r.isHead ? " · руководитель" : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function EditResource({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource || !isUuid(id)) notFound();
  const columns = getTableColumns(resource.table) as Record<string, PgColumn>;
  const [row] = (await db.select().from(resource.table).where(eq(columns.id, id))) as Record<string, unknown>[];
  if (!row) notFound();
  const relations = await loadRelations(resource.fields);
  if (key === "offices" && relations.offices) relations.offices = relations.offices.filter((o) => o.value !== id);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-burgundy-950">{tr(row[resource.titleField] as Localized, "ru") || "Без названия"}</h1>
        {row.published !== false && <a href={`/ru${resource.publicPath(row)}`} target="_blank" className="flex items-center gap-1.5 text-sm font-semibold text-burgundy-700 hover:underline"><ExternalLink className="h-4 w-4" aria-hidden="true" />Открыть на сайте</a>}
      </div>
      <div className="border border-line bg-white p-4 md:p-6">
        <ResourceForm
          fields={resource.fields}
          values={toFormValues(resource.fields, row)}
          relations={relations}
          appointments={key === "persons" ? await loadAppointments(id) : undefined}
          action={saveResource.bind(null, key, id)}
          cancelHref={`/admin/r/${key}`}
        />
      </div>
      {key === "offices" && <StaffPanel title="Специалисты" kind="SPECIALIST" param="officeId" id={id} column={appointments.officeId} />}
      {key === "departments" && <StaffPanel title="Преподаватели" kind="TEACHER" param="departmentId" id={id} column={appointments.departmentId} />}
      {key === "faculties" && <StaffPanel title="Декан" kind="DEAN" param="facultyId" id={id} column={appointments.facultyId} />}
    </>
  );
}
