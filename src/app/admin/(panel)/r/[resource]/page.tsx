import { asc, count, desc, inArray, sql, type SQL } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { CheckCircle2, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteResource } from "@/admin/actions";
import { loadRelations, personIdsWithKind } from "@/admin/data";
import { getResource } from "@/admin/resources";
import { ConfirmButton } from "@/components/admin/Forms";
import { db } from "@/db";
import type { Localized } from "@/db/schema";
import { formatDateTime, tr } from "@/lib/text";

const PAGE_SIZE = 25;
const KIND_TITLES: Record<string, string> = { TEACHER: "Преподаватели", SPECIALIST: "Специалисты", LEADERSHIP: "Руководство", DEAN: "Деканы" };
const OFFICE_KINDS: Record<string, string> = { DEPARTMENT: "Департамент", DIVISION: "Отдел", OFFICE: "Офис", CENTER: "Центр" };

export default async function ResourceList({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ q?: string; page?: string; kind?: string; saved?: string }> }) {
  const resource = getResource((await params).resource);
  if (!resource) notFound();
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const q = (query.q ?? "").trim();
  const kind = resource.key === "persons" && query.kind && KIND_TITLES[query.kind] ? query.kind : undefined;

  const columns = getTableColumns(resource.table) as Record<string, PgColumn>;
  const filters: SQL[] = [];
  if (q) filters.push(sql`(${columns[resource.titleField]}::text ILIKE ${`%${q}%`})`);
  if (kind) {
    const ids = (await personIdsWithKind(kind as "TEACHER")).map((r) => r.id);
    filters.push(ids.length ? inArray(columns.id, ids) : sql`false`);
  }
  const where = filters.length ? sql.join(filters, sql` AND `) : undefined;
  const order = resource.orderBy.desc ? desc(columns[resource.orderBy.column]) : asc(columns[resource.orderBy.column]);
  const [rows, [{ total }], relations] = await Promise.all([
    db.select().from(resource.table).where(where).orderBy(order).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE) as Promise<Record<string, unknown>[]>,
    db.select({ total: count() }).from(resource.table).where(where),
    loadRelations(resource.fields),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const title = kind ? KIND_TITLES[kind] : resource.title;
  const base = `/admin/r/${resource.key}`;
  const linkTo = (p: number) => `${base}?${new URLSearchParams({ ...(q && { q }), ...(kind && { kind }), page: String(p) })}`;

  const cell = (name: string, relation: string | undefined, row: Record<string, unknown>) => {
    const value = row[name];
    if (relation) return relations[relation as "faculties"]?.find((o) => o.value === value)?.label ?? "—";
    if (value instanceof Date) return formatDateTime(value, "ru");
    if (name === "kind") return OFFICE_KINDS[String(value)] ?? String(value);
    return String(value ?? "—");
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-burgundy-950">{title}</h1>
        <Link href={`${base}/new${kind ? `?kind=${kind}` : ""}`} className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden="true" />Добавить {resource.singular}</Link>
      </div>
      {query.saved && <p role="status" className="mt-4 flex items-center gap-2 border-l-4 border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Сохранено</p>}
      <form className="mt-5 flex max-w-md gap-2">
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input name="q" type="search" defaultValue={q} placeholder="Поиск по названию" aria-label="Поиск по названию" className="field" />
        <button className="btn btn-outline" aria-label="Найти"><Search className="h-4 w-4" aria-hidden="true" /></button>
      </form>
      <div className="mt-5 overflow-x-auto border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-burgundy-50 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Название</th>
              {resource.columns?.map((c) => <th key={c.name} className="whitespace-nowrap px-4 py-2.5 font-semibold">{c.label}</th>)}
              <th className="px-4 py-2.5 font-semibold">Статус</th>
              <th className="px-4 py-2.5"><span className="sr-only">Действия</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <tr><td colSpan={99} className="px-4 py-10 text-center text-muted">Записей нет</td></tr>}
            {rows.map((row) => {
              const id = String(row.id);
              const published = row.published !== false;
              return (
                <tr key={id} className="hover:bg-burgundy-50/50">
                  <td className="px-4 py-2.5 font-medium">
                    <Link href={`${base}/${id}`} className="hover:text-burgundy-700">{tr(row[resource.titleField] as Localized, "ru") || "Без названия"}</Link>
                  </td>
                  {resource.columns?.map((c) => <td key={c.name} className="whitespace-nowrap px-4 py-2.5 text-muted">{cell(c.name, c.relation, row)}</td>)}
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className={`px-2 py-0.5 text-xs font-semibold ${published ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>{published ? "Опубликовано" : "Черновик"}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="flex items-center justify-end gap-2.5">
                      {published && <a href={`/ru${resource.publicPath(row)}`} target="_blank" aria-label="Открыть на сайте" className="text-muted hover:text-burgundy-700"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}
                      <Link href={`${base}/${id}`} aria-label="Изменить" className="text-muted hover:text-burgundy-700"><Pencil className="h-4 w-4" aria-hidden="true" /></Link>
                      <ConfirmButton action={deleteResource.bind(null, resource.key, id)} label={<Trash2 className="h-4 w-4" aria-label="Удалить" />} confirmLabel="Удалить?" className="text-sm text-muted hover:text-burgundy-700" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="mt-4 flex items-center gap-2 text-sm" aria-label="Страницы">
          {page > 1 && <Link className="btn btn-outline !py-1.5" href={linkTo(page - 1)}>Назад</Link>}
          <span className="text-muted">Страница {page} из {pages}</span>
          {page < pages && <Link className="btn btn-outline !py-1.5" href={linkTo(page + 1)}>Вперёд</Link>}
        </nav>
      )}
    </>
  );
}
