import { count } from "drizzle-orm";
import { ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { ReindexButton } from "@/components/admin/ReindexButton";
import { db } from "@/db";
import { departments, events, faculties, news, pages, persons, programs } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { filesCount, listApplications } from "@/lib/services";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "Обзор" };

const COUNTERS = [
  { label: "Новости", table: news, href: "/admin/r/news" },
  { label: "Мероприятия", table: events, href: "/admin/r/events" },
  { label: "Страницы", table: pages, href: "/admin/r/pages" },
  { label: "Факультеты", table: faculties, href: "/admin/r/faculties" },
  { label: "Кафедры", table: departments, href: "/admin/r/departments" },
  { label: "Программы", table: programs, href: "/admin/r/programs" },
  { label: "Сотрудники", table: persons, href: "/admin/r/persons" },
];

export default async function Dashboard() {
  const user = await getSessionUser();
  const totals = await Promise.all(COUNTERS.map(async (c) => (await db.select({ total: count() }).from(c.table))[0].total));
  const [files, recent] = await Promise.all([
    filesCount(),
    listApplications({ status: "NEW", limit: 6 }).then((r) => r.rows.map((row) => row.application), () => null),
  ]);
  return (
    <>
      <h1 className="text-3xl text-burgundy-950">Здравствуйте, {user?.name}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {COUNTERS.map((c, i) => (
          <Link key={c.href} href={c.href} className="card card-link p-4">
            <span className="font-serif text-3xl font-semibold text-burgundy-700">{totals[i]}</span>
            <span className="mt-1 text-sm text-muted">{c.label}</span>
          </Link>
        ))}
        <Link href="/admin/files" className="card card-link p-4">
          <span className="font-serif text-3xl font-semibold text-burgundy-700">{files ?? "—"}</span>
          <span className="mt-1 text-sm text-muted">Файлы</span>
        </Link>
      </div>
      <section className="mt-8 border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="flex items-center gap-2 text-lg text-burgundy-950"><Inbox className="h-5 w-5 text-burgundy-700" aria-hidden="true" />Новые заявки</h2>
          <Link href="/admin/applications" className="flex items-center gap-1 text-sm font-semibold text-burgundy-700 hover:underline">Все заявки<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        {recent === null ? <p className="px-5 py-8 text-center text-muted">Сервис заявок временно недоступен</p> : recent.length === 0 ? <p className="px-5 py-8 text-center text-muted">Новых заявок нет</p> : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm">
                <span className="font-medium">{a.fullName}</span>
                <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="text-burgundy-700 hover:underline">{a.phone}</a>
                <span className="text-muted">{formatDateTime(a.createdAt, "ru")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {user?.role === "ADMIN" && <div className="mt-6"><ReindexButton /></div>}
    </>
  );
}
