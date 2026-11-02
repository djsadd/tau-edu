import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { deleteApplication, updateApplication } from "@/admin/actions";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/Forms";
import { requireUser } from "@/lib/auth";
import { listApplications } from "@/lib/services";
import { formatDateTime, tr } from "@/lib/text";

export const metadata = { title: "Заявки" };
const PAGE_SIZE = 30;

const STATUSES = {
  NEW: { label: "Новая", className: "bg-burgundy-700 text-white" },
  IN_PROGRESS: { label: "В работе", className: "bg-amber-100 text-amber-900" },
  ENROLLED: { label: "Поступил(-а)", className: "bg-emerald-100 text-emerald-900" },
  DECLINED: { label: "Отказ", className: "bg-stone-200 text-stone-700" },
} as const;
type Status = keyof typeof STATUSES;

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const status = query.status && query.status in STATUSES ? (query.status as Status) : undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const { rows, total } = await listApplications({ status, page, limit: PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tab = (active: boolean) => `px-3 py-1.5 text-sm font-semibold ${active ? "bg-burgundy-700 text-white" : "border border-line bg-white hover:border-burgundy-700"}`;
  const linkTo = (p: number) => `/admin/applications?${new URLSearchParams({ ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <h1 className="text-3xl text-burgundy-950">Заявки «Хочу поступить»</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/admin/applications" className={tab(!status)}>Все</Link>
        {(Object.keys(STATUSES) as Status[]).map((s) => <Link key={s} href={`/admin/applications?status=${s}`} className={tab(status === s)}>{STATUSES[s].label}</Link>)}
      </div>
      <div className="mt-5 space-y-3">
        {rows.length === 0 && <p className="border border-line bg-white px-5 py-12 text-center text-muted">Заявок нет</p>}
        {rows.map(({ application: a, program, degree }) => (
          <details key={a.id} className="group border border-line bg-white">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className={`px-2 py-0.5 text-xs font-semibold ${STATUSES[a.status].className}`}>{STATUSES[a.status].label}</span>
              <span className="font-semibold">{a.fullName}</span>
              <span className="text-sm text-muted">{program ? tr(program, "ru") : degree ? tr(degree, "ru") : "Программа не выбрана"}</span>
              <span className="ml-auto text-sm text-muted">{formatDateTime(a.createdAt, "ru")}</span>
            </summary>
            <div className="grid gap-5 border-t border-line p-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 font-medium text-burgundy-700 hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{a.phone}</a>
                {a.email && <a href={`mailto:${a.email}`} className="flex items-center gap-2 font-medium text-burgundy-700 hover:underline"><Mail className="h-4 w-4" aria-hidden="true" />{a.email}</a>}
                <p className="text-muted">Язык заявки: {a.locale.toUpperCase()}</p>
                <p className="text-muted">Согласие на обработку данных: {formatDateTime(a.consentAt, "ru")}</p>
                {a.message && <p className="whitespace-pre-wrap border-l-2 border-burgundy-200 pl-3">{a.message}</p>}
              </div>
              <ActionForm action={updateApplication.bind(null, a.id)} className="space-y-3">
                <div>
                  <label className="field-label" htmlFor={`status-${a.id}`}>Статус</label>
                  <select id={`status-${a.id}`} name="status" defaultValue={a.status} className="field">
                    {(Object.keys(STATUSES) as Status[]).map((s) => <option key={s} value={s}>{STATUSES[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor={`notes-${a.id}`}>Заметки</label>
                  <textarea id={`notes-${a.id}`} name="notes" rows={2} defaultValue={a.notes ?? ""} className="field" />
                </div>
                <div className="flex items-center justify-between">
                  <SubmitButton className="btn btn-primary !py-1.5 text-sm">Сохранить</SubmitButton>
                  {user.role === "ADMIN" && <ConfirmButton action={deleteApplication.bind(null, a.id)} label="Удалить заявку" />}
                </div>
              </ActionForm>
            </div>
          </details>
        ))}
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
