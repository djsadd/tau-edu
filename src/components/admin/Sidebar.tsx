"use client";

import { Award, Building2, CalendarDays, FileStack, FolderOpen, GraduationCap, Inbox, LayoutDashboard, Library, LogOut, Menu, Newspaper, Settings, ShieldCheck, Users, UserCog, UsersRound, X, BookOpen, Landmark, Briefcase, ExternalLink, School } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ComponentType } from "react";
import { logout } from "@/admin/actions";
import { Crest } from "@/components/site/Logo";

type Item = { href: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number; adminOnly?: boolean };

function Nav({ newApplications, role, onNavigate }: { newApplications: number; role: string; onNavigate: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const groups: { title?: string; items: Item[] }[] = [
    { items: [
      { href: "/admin", label: "Обзор", icon: LayoutDashboard },
      { href: "/admin/applications", label: "Заявки", icon: Inbox, badge: newApplications },
    ] },
    { title: "Контент", items: [
      { href: "/admin/r/news", label: "Новости", icon: Newspaper },
      { href: "/admin/r/events", label: "Мероприятия", icon: CalendarDays },
      { href: "/admin/r/pages", label: "Страницы", icon: FileStack },
    ] },
    { title: "Структура", items: [
      { href: "/admin/r/faculties", label: "Факультеты", icon: School },
      { href: "/admin/r/departments", label: "Кафедры", icon: Library },
      { href: "/admin/r/programs", label: "Образовательные программы", icon: BookOpen },
      { href: "/admin/r/degrees", label: "Академические степени", icon: Award },
      { href: "/admin/r/offices", label: "Отделы и департаменты", icon: Building2 },
    ] },
    { title: "Люди", items: [
      { href: "/admin/r/persons?kind=TEACHER", label: "Преподаватели", icon: GraduationCap },
      { href: "/admin/r/persons?kind=SPECIALIST", label: "Специалисты", icon: Briefcase },
      { href: "/admin/r/persons?kind=LEADERSHIP", label: "Руководство", icon: Landmark },
      { href: "/admin/r/persons", label: "Все сотрудники", icon: UsersRound },
      { href: "/admin/r/studentOrgs", label: "Студенческие объединения", icon: Users },
    ] },
    { title: "Сайт", items: [
      { href: "/admin/menu", label: "Меню", icon: Menu },
      { href: "/admin/files", label: "Файлы", icon: FolderOpen },
      { href: "/admin/settings", label: "Настройки", icon: Settings, adminOnly: true },
      { href: "/admin/users", label: "Пользователи", icon: UserCog, adminOnly: true },
    ] },
  ];
  const current = pathname + (params.get("kind") ? `?kind=${params.get("kind")}` : "");
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href.includes("?")) return current.startsWith(href);
    if (href === "/admin/r/persons") return pathname.startsWith(href) && !params.get("kind");
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Разделы админки">
      {groups.map((group, i) => {
        const items = group.items.filter((item) => !item.adminOnly || role === "ADMIN");
        return (
          <div key={i}>
            {group.title && <div className="mb-1 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-burgundy-300">{group.title}</div>}
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon, badge }) => (
                <li key={href}>
                  <Link href={href} onClick={onNavigate} aria-current={isActive(href) ? "page" : undefined} className={`flex items-center gap-2.5 px-3 py-2 text-sm ${isActive(href) ? "bg-white font-semibold text-burgundy-900" : "text-burgundy-100 hover:bg-white/10"}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 leading-tight">{label}</span>
                    {!!badge && <span className="rounded-full bg-white px-1.5 text-xs font-bold text-burgundy-800">{badge}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ user, newApplications }: { user: { name: string; role: string }; newApplications: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between bg-burgundy-950 px-4 py-2 text-white md:hidden">
        <span className="flex items-center gap-2 font-serif font-semibold"><Crest className="h-8 w-7" inverse />Админка</span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Открыть меню" className="p-2"><Menu className="h-6 w-6" aria-hidden="true" /></button>
      </div>
      {open && <button type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-burgundy-950 text-white transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
          <Crest className="h-9 w-8" inverse />
          <span className="flex-1 font-serif font-semibold">Управление сайтом</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть меню" className="p-1 md:hidden"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <Suspense>
          <Nav newApplications={newApplications} role={user.role} onNavigate={() => setOpen(false)} />
        </Suspense>
        <div className="space-y-1 border-t border-white/10 p-3 text-sm">
          <a href="/" target="_blank" className="flex items-center gap-2.5 px-3 py-1.5 text-burgundy-100 hover:bg-white/10"><ExternalLink className="h-4 w-4" aria-hidden="true" />Открыть сайт</a>
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-burgundy-200"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{user.name}</span></div>
          <form action={logout}>
            <button className="flex w-full items-center gap-2.5 px-3 py-1.5 text-burgundy-100 hover:bg-white/10"><LogOut className="h-4 w-4" aria-hidden="true" />Выйти</button>
          </form>
        </div>
      </aside>
    </>
  );
}
