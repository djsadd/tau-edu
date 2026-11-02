import { notFound } from "next/navigation";
import { saveResource } from "@/admin/actions";
import { loadRelations, toFormValues } from "@/admin/data";
import type { AppointmentDraft } from "@/admin/fields";
import { getResource } from "@/admin/resources";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { isUuid } from "@/lib/text";

const KINDS = ["LEADERSHIP", "DEAN", "TEACHER", "SPECIALIST"] as const;

export default async function NewResource({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ kind?: string; departmentId?: string; officeId?: string; facultyId?: string }> }) {
  const resource = getResource((await params).resource);
  if (!resource) notFound();
  const query = await searchParams;
  const relations = await loadRelations(resource.fields);
  const defaults: Record<string, unknown> = { published: true, sortOrder: 0, kind: "OFFICE", publishedAt: new Date() };

  // Переход «Добавить специалиста» со страницы отдела сразу подставляет отдел.
  const kind = KINDS.find((k) => k === query.kind);
  const appointments: AppointmentDraft[] = kind
    ? [{
        kind,
        position: {},
        facultyId: isUuid(query.facultyId) ? query.facultyId : "",
        departmentId: isUuid(query.departmentId) ? query.departmentId : "",
        officeId: isUuid(query.officeId) ? query.officeId : "",
        isHead: false,
      }]
    : [];

  return (
    <>
      <h1 className="mb-6 text-3xl text-burgundy-950">Добавить {resource.singular}</h1>
      <div className="border border-line bg-white p-4 md:p-6">
        <ResourceForm
          fields={resource.fields}
          values={toFormValues(resource.fields, defaults)}
          relations={relations}
          appointments={appointments}
          action={saveResource.bind(null, resource.key, null)}
          cancelHref={`/admin/r/${resource.key}`}
        />
      </div>
    </>
  );
}
