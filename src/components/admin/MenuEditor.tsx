"use client";

import { ArrowDown, ArrowUp, ChevronRight, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMenuItem, moveMenuItem, saveMenuItem } from "@/admin/actions";
import type { ActionResult } from "@/admin/fields";
import type { Localized } from "@/db/schema";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { ActionForm, ConfirmButton, SubmitButton } from "./Forms";

export type MenuRow = {
  id: string; parentId: string | null; kind: "GROUP" | "SECTION" | "PAGE" | "URL"; label: Localized;
  sectionKey: string | null; pageId: string | null; url: string | null; openInNewTab: boolean; visible: boolean; displayLabel: string;
};
type Option = { value: string; label: string };

const KINDS = [
  { value: "SECTION", label: "Раздел сайта" },
  { value: "PAGE", label: "Созданная страница" },
  { value: "URL", label: "Внешняя или своя ссылка" },
  { value: "GROUP", label: "Группа (только выпадающий список)" },
];

function ItemForm({ item, location, parents, sections, pages, onDone, onSave }: { item?: MenuRow; location: string; parents: Option[]; sections: Option[]; pages: Option[]; onDone: () => void; onSave: (s: ActionResult, f: FormData) => Promise<ActionResult> }) {
  const [kind, setKind] = useState(item?.kind ?? "SECTION");
  return (
    <ActionForm action={onSave} onSuccess={onDone} className="grid gap-3 bg-burgundy-50 p-4 md:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="location" value={location} />
      <label className="text-sm font-semibold">Тип пункта
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as MenuRow["kind"])} className="field mt-1 font-normal">
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Родительский пункт
        <select name="parentId" defaultValue={item?.parentId ?? ""} className="field mt-1 font-normal">
          <option value="">Верхний уровень</option>
          {parents.filter((p) => p.value !== item?.id).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </label>
      {kind === "SECTION" && (
        <label className="text-sm font-semibold md:col-span-2">Раздел
          <select name="sectionKey" defaultValue={item?.sectionKey ?? ""} className="field mt-1 font-normal">
            <option value="">Выберите…</option>
            {sections.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      )}
      {kind === "PAGE" && (
        <label className="text-sm font-semibold md:col-span-2">Страница
          <select name="pageId" defaultValue={item?.pageId ?? ""} className="field mt-1 font-normal">
            <option value="">Выберите…</option>
            {pages.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      )}
      {kind === "URL" && (
        <label className="text-sm font-semibold md:col-span-2">Ссылка
          <input name="url" defaultValue={item?.url ?? ""} placeholder="https://… или /ru/programs" className="field mt-1 font-normal" />
        </label>
      )}
      <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
        {LOCALES.map((l) => (
          <label key={l} className="text-sm font-semibold">Название ({LOCALE_LABELS[l].name})
            <input name={`label.${l}`} defaultValue={item?.label[l] ?? ""} placeholder={kind === "SECTION" ? "Как у раздела" : ""} className="field mt-1 font-normal" />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-5 md:col-span-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible" defaultChecked={item?.visible ?? true} className="h-4 w-4 accent-burgundy-700" />Показывать</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="openInNewTab" defaultChecked={item?.openInNewTab ?? false} className="h-4 w-4 accent-burgundy-700" />В новой вкладке</label>
        <SubmitButton className="btn btn-primary !py-1.5 text-sm">Сохранить</SubmitButton>
      </div>
    </ActionForm>
  );
}

function Tree({ rows, parentId, depth, ...ctx }: { rows: MenuRow[]; parentId: string | null; depth: number; location: string; parents: Option[]; sections: Option[]; pages: Option[]; editing: string | null; setEditing: (id: string | null) => void; onMove: (id: string, d: "up" | "down") => void }) {
  const level = rows.filter((r) => r.parentId === parentId);
  return (
    <>
      {level.map((row, i) => (
        <li key={row.id}>
          <div className="flex items-center gap-2 border-b border-line bg-white py-2.5 pr-3" style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}>
            {depth > 0 && <ChevronRight className="h-4 w-4 text-burgundy-300" aria-hidden="true" />}
            <span className={`flex-1 font-medium ${row.visible ? "" : "text-muted"}`}>{row.displayLabel}</span>
            {!row.visible && <EyeOff className="h-4 w-4 text-muted" aria-label="Скрыт" />}
            <span className="hidden text-xs text-muted sm:inline">{KINDS.find((k) => k.value === row.kind)?.label}</span>
            <button type="button" aria-label="Выше" disabled={i === 0} onClick={() => ctx.onMove(row.id, "up")} className="p-1 text-muted hover:text-burgundy-700 disabled:opacity-25"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" aria-label="Ниже" disabled={i === level.length - 1} onClick={() => ctx.onMove(row.id, "down")} className="p-1 text-muted hover:text-burgundy-700 disabled:opacity-25"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" aria-label="Изменить" onClick={() => ctx.setEditing(ctx.editing === row.id ? null : row.id)} className="p-1 text-muted hover:text-burgundy-700"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
            <ConfirmButton action={() => deleteMenuItem(row.id)} label={<Trash2 className="h-4 w-4" aria-label="Удалить" />} confirmLabel="Удалить?" className="p-1 text-sm text-muted hover:text-burgundy-700" />
          </div>
          {ctx.editing === row.id && <ItemForm item={row} location={ctx.location} parents={ctx.parents} sections={ctx.sections} pages={ctx.pages} onDone={() => ctx.setEditing(null)} onSave={saveMenuItem} />}
          <ul><Tree rows={rows} parentId={row.id} depth={depth + 1} {...ctx} /></ul>
        </li>
      ))}
    </>
  );
}

export function MenuEditor({ title, location, rows, sections, pages }: { title: string; location: "HEADER" | "FOOTER"; rows: MenuRow[]; sections: Option[]; pages: Option[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const parents = rows.filter((r) => !r.parentId).map((r) => ({ value: r.id, label: r.displayLabel }));
  const onMove = (id: string, direction: "up" | "down") => start(async () => { await moveMenuItem(id, direction); router.refresh(); });
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl text-burgundy-950">{title}</h2>
        <button type="button" onClick={() => setAdding(!adding)} className="btn btn-primary !py-1.5 text-sm"><Plus className="h-4 w-4" aria-hidden="true" />Добавить пункт</button>
      </div>
      {adding && <div className="mb-3"><ItemForm location={location} parents={parents} sections={sections} pages={pages} onDone={() => { setAdding(false); router.refresh(); }} onSave={saveMenuItem} /></div>}
      <ul className="border-x border-t border-line">
        <Tree rows={rows} parentId={null} depth={0} location={location} parents={parents} sections={sections} pages={pages} editing={editing} setEditing={setEditing} onMove={onMove} />
      </ul>
    </section>
  );
}
