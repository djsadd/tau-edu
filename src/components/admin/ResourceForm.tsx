"use client";

import { ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { ActionResult, AppointmentDraft, Field, RelationOptions } from "@/admin/fields";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { FormMessage, FormPending, SubmitButton, useKeepingAction } from "./Forms";
import { MediaPicker } from "./MediaPicker";
import { RichEditor } from "./RichEditor";

type Values = Record<string, unknown>;
const KIND_LABELS: Record<AppointmentDraft["kind"], string> = {
  TEACHER: "Преподаватель кафедры",
  SPECIALIST: "Специалист отдела / департамента",
  DEAN: "Декан факультета",
  LEADERSHIP: "Руководство университета",
};

function ImageField({ field, value }: { field: Field; value: string }) {
  const [id, setId] = useState(value);
  const [picking, setPicking] = useState(false);
  return (
    <div>
      <input type="hidden" name={field.name} value={id} />
      <div className="flex items-center gap-3">
        <span className="flex h-20 w-28 items-center justify-center overflow-hidden border border-line bg-burgundy-50">
          {id ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/files/${id}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-burgundy-300" aria-hidden="true" />
          )}
        </span>
        <button type="button" className="btn btn-outline !px-3 !py-1.5 text-sm" onClick={() => setPicking(true)}>Выбрать</button>
        {id && <button type="button" onClick={() => setId("")} aria-label="Убрать изображение" className="p-1 text-muted hover:text-burgundy-700"><X className="h-4 w-4" aria-hidden="true" /></button>}
      </div>
      <MediaPicker open={picking} onClose={() => setPicking(false)} onPick={(file) => { setId(file.id); setPicking(false); }} />
    </div>
  );
}

function AppointmentsField({ initial, relations, locale }: { initial: AppointmentDraft[]; relations: RelationOptions; locale: Locale }) {
  const [rows, setRows] = useState(initial);
  const update = (index: number, patch: Partial<AppointmentDraft>) => setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <div className="space-y-3">
      <input type="hidden" name="appointments" value={JSON.stringify(rows)} />
      {rows.map((row, i) => (
        <div key={i} className="grid gap-3 border border-line bg-burgundy-50/50 p-3 md:grid-cols-2">
          <div>
            <label className="field-label" htmlFor={`kind-${i}`}>Роль</label>
            <select id={`kind-${i}`} className="field" value={row.kind} onChange={(e) => update(i, { kind: e.target.value as AppointmentDraft["kind"] })}>
              {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          {row.kind !== "LEADERSHIP" && (
            <div>
              <label className="field-label" htmlFor={`unit-${i}`}>{row.kind === "TEACHER" ? "Кафедра" : row.kind === "SPECIALIST" ? "Отдел / департамент / офис" : "Факультет"}</label>
              {row.kind === "TEACHER" && (
                <select id={`unit-${i}`} className="field" value={row.departmentId} onChange={(e) => update(i, { departmentId: e.target.value })}>
                  <option value="">Выберите…</option>
                  {relations.departments?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              {row.kind === "SPECIALIST" && (
                <select id={`unit-${i}`} className="field" value={row.officeId} onChange={(e) => update(i, { officeId: e.target.value })}>
                  <option value="">Выберите…</option>
                  {relations.offices?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              {row.kind === "DEAN" && (
                <select id={`unit-${i}`} className="field" value={row.facultyId} onChange={(e) => update(i, { facultyId: e.target.value })}>
                  <option value="">Выберите…</option>
                  {relations.faculties?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
            </div>
          )}
          <div className="md:col-span-2">
            <label className="field-label" htmlFor={`position-${i}`}>Должность ({LOCALE_LABELS[locale].name})</label>
            <input
              id={`position-${i}`}
              className="field"
              value={row.position[locale] ?? ""}
              onChange={(e) => update(i, { position: { ...row.position, [locale]: e.target.value } })}
            />
          </div>
          <div className="flex items-center justify-between md:col-span-2">
            {row.kind === "TEACHER" || row.kind === "SPECIALIST" ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={row.isHead} onChange={(e) => update(i, { isHead: e.target.checked })} className="h-4 w-4 accent-burgundy-700" />
                Руководитель подразделения
              </label>
            ) : <span />}
            <button type="button" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} className="flex items-center gap-1 text-sm text-burgundy-700 hover:underline">
              <Trash2 className="h-4 w-4" aria-hidden="true" />Убрать
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline !px-3 !py-1.5 text-sm"
        onClick={() => setRows((r) => [...r, { kind: "TEACHER", position: {}, facultyId: "", departmentId: "", officeId: "", isHead: false }])}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />Добавить должность
      </button>
    </div>
  );
}

function SingleField({ field, value, relations }: { field: Field; value: unknown; relations: RelationOptions }) {
  const text = value === null || value === undefined ? "" : String(value);
  const id = `f-${field.name}`;
  switch (field.type) {
    case "textarea":
      return <textarea id={id} name={field.name} defaultValue={text} rows={3} className="field" />;
    case "number":
      return <input id={id} name={field.name} type="number" step={1} defaultValue={text} className="field max-w-48" />;
    case "datetime":
      return <input id={id} name={field.name} type="datetime-local" defaultValue={text} className="field max-w-64" />;
    case "email":
      return <input id={id} name={field.name} type="email" defaultValue={text} className="field" />;
    case "url":
      return <input id={id} name={field.name} type="url" defaultValue={text} placeholder="https://" className="field" />;
    case "select":
      return (
        <select id={id} name={field.name} defaultValue={text} className="field">
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "relation":
      return (
        <select id={id} name={field.name} defaultValue={text} className="field">
          <option value="">{field.required ? "Выберите…" : "Не указано"}</option>
          {(relations[field.relation!] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "image":
      return <ImageField field={field} value={text} />;
    default:
      return <input id={id} name={field.name} defaultValue={text} className="field" />;
  }
}

export function ResourceForm({
  fields,
  values,
  relations,
  action,
  appointments,
  submitLabel = "Сохранить",
  cancelHref,
}: {
  fields: Field[];
  values: Values;
  relations: RelationOptions;
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  appointments?: AppointmentDraft[];
  submitLabel?: string;
  cancelHref?: string;
}) {
  const { state, pending, onSubmit } = useKeepingAction(action);
  const [locale, setLocale] = useState<Locale>("ru");
  const hasLocalized = fields.some((f) => ["ltext", "ltextarea", "lrich", "appointments"].includes(f.type));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {hasLocalized && (
        <div className="sticky top-0 z-20 -mx-4 flex items-center gap-1 border-b border-line bg-white px-4 py-2 md:-mx-6 md:px-6">
          <span className="mr-2 text-sm text-muted">Язык:</span>
          {LOCALES.map((l) => (
            <button key={l} type="button" onClick={() => setLocale(l)} aria-pressed={locale === l} className={`px-3 py-1.5 text-sm font-semibold ${locale === l ? "bg-burgundy-700 text-white" : "border border-line hover:border-burgundy-700"}`}>
              {LOCALE_LABELS[l].name}
            </button>
          ))}
        </div>
      )}

      {fields.map((field) => {
        if (field.type === "checkbox") {
          return (
            <label key={field.name} className="flex items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" name={field.name} defaultChecked={Boolean(values[field.name])} className="h-4 w-4 accent-burgundy-700" />
              {field.label}
            </label>
          );
        }
        const localized = ["ltext", "ltextarea", "lrich"].includes(field.type);
        return (
          <div key={field.name}>
            <div className="field-label">
              {localized || field.type === "appointments" || field.type === "image" ? (
                field.label
              ) : (
                <label htmlFor={`f-${field.name}`}>{field.label}</label>
              )}
              {field.required && <span className="text-burgundy-700"> *</span>}
            </div>
            {localized &&
              LOCALES.map((l) => {
                const current = ((values[field.name] ?? {}) as Record<string, string>)[l] ?? "";
                const name = `${field.name}.${l}`;
                const aria = `${field.label} (${LOCALE_LABELS[l].name})`;
                // Все языки остаются в форме, скрытые просто не показываются — иначе их значения потерялись бы при отправке.
                return (
                  <div key={l} hidden={locale !== l}>
                    {field.type === "ltext" && <input name={name} defaultValue={current} aria-label={aria} className="field" />}
                    {field.type === "ltextarea" && <textarea name={name} defaultValue={current} aria-label={aria} rows={3} className="field" />}
                    {field.type === "lrich" && <RichEditor name={name} defaultValue={current} label={aria} />}
                  </div>
                );
              })}
            {field.type === "appointments" && <AppointmentsField initial={appointments ?? []} relations={relations} locale={locale} />}
            {!localized && field.type !== "appointments" && <SingleField field={field} value={values[field.name]} relations={relations} />}
            {field.help && <p className="mt-1 text-xs text-muted">{field.help}</p>}
          </div>
        );
      })}

      <FormMessage state={state} />
      <div className="flex items-center gap-3 border-t border-line pt-5">
        <FormPending value={pending}><SubmitButton>{submitLabel}</SubmitButton></FormPending>
        {cancelHref && <a href={cancelHref} className="btn btn-outline">Отмена</a>}
      </div>
    </form>
  );
}
