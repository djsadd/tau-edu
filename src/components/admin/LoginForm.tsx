"use client";

import { login } from "@/admin/actions";
import { FormMessage, FormPending, SubmitButton, useKeepingAction } from "./Forms";

export function LoginForm() {
  const { state, pending, onSubmit } = useKeepingAction(login);
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <FormMessage state={state} />
      <div>
        <label className="field-label" htmlFor="email">Эл. почта</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      <FormPending value={pending}><SubmitButton className="btn btn-primary w-full">Войти</SubmitButton></FormPending>
    </form>
  );
}
