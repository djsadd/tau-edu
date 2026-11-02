import { asc } from "drizzle-orm";
import { changeOwnPassword, createUser, deleteUser } from "@/admin/actions";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/Forms";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Пользователи" };

export default async function UsersPage() {
  const me = await requireAdmin();
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).orderBy(asc(users.createdAt));
  return (
    <>
      <h1 className="mb-6 text-3xl text-burgundy-950">Пользователи</h1>
      <ul className="divide-y divide-line border border-line bg-white">
        {rows.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span><span className="font-semibold">{u.name}</span> <span className="text-muted">{u.email}</span></span>
            <span className="flex items-center gap-4">
              <span className="bg-burgundy-50 px-2 py-0.5 text-xs font-semibold text-burgundy-800">{u.role === "ADMIN" ? "Администратор" : "Редактор"}</span>
              {u.id !== me.id && <ConfirmButton action={deleteUser.bind(null, u.id)} label="Удалить" />}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="border border-line bg-white p-5">
          <h2 className="mb-4 text-xl text-burgundy-950">Новый пользователь</h2>
          <ActionForm action={createUser} resetOnSuccess className="space-y-3">
            <div><label className="field-label" htmlFor="name">Имя</label><input id="name" name="name" required className="field" /></div>
            <div><label className="field-label" htmlFor="email">Эл. почта</label><input id="email" name="email" type="email" required autoComplete="off" className="field" /></div>
            <div><label className="field-label" htmlFor="password">Пароль (от 10 символов)</label><input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" /></div>
            <div>
              <label className="field-label" htmlFor="role">Роль</label>
              <select id="role" name="role" defaultValue="EDITOR" className="field">
                <option value="EDITOR">Редактор: контент, файлы, меню и заявки</option>
                <option value="ADMIN">Администратор: всё, включая настройки и пользователей</option>
              </select>
            </div>
            <SubmitButton>Создать</SubmitButton>
          </ActionForm>
        </section>
        <section className="h-fit border border-line bg-white p-5">
          <h2 className="mb-4 text-xl text-burgundy-950">Мой пароль</h2>
          <ActionForm action={changeOwnPassword} resetOnSuccess className="space-y-3">
            <div><label className="field-label" htmlFor="own-password">Новый пароль</label><input id="own-password" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" /></div>
            <SubmitButton>Сменить пароль</SubmitButton>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
