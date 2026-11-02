"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useActionState, useContext, useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { ActionResult } from "@/admin/fields";

const PendingContext = createContext(false);
export const FormPending = PendingContext.Provider;

/**
 * Отправка без атрибута action: при нём React 19 очищает форму после каждого ответа,
 * и при ошибке валидации редактор потерял бы весь введённый текст.
 */
export function useKeepingAction(action: (state: ActionResult, form: FormData) => Promise<ActionResult>) {
  const [state, dispatch, pending] = useActionState(action, null);
  const [, start] = useTransition();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    start(() => dispatch(data));
  };
  return { state, pending, onSubmit };
}

export function SubmitButton({ children, className = "btn btn-primary" }: { children: ReactNode; className?: string }) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionResult }) {
  if (state?.error) return <p role="alert" className="border-l-4 border-burgundy-700 bg-burgundy-50 px-3 py-2 text-sm font-medium text-burgundy-800">{state.error}</p>;
  if (state?.message) return <p role="status" className="border-l-4 border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">{state.message}</p>;
  return null;
}

/** Форма на серверном действии: показывает ошибку и при успехе может очиститься. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
}: {
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const { state, pending, onSubmit } = useKeepingAction(action);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
    // Реагируем только на новый результат действия.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      <FormMessage state={state} />
      <FormPending value={pending}>{children}</FormPending>
    </form>
  );
}

/** Кнопка с подтверждением в два нажатия: браузерные confirm() блокируют страницу и плохо выглядят. */
export function ConfirmButton({
  action,
  label,
  confirmLabel = "Точно удалить?",
  className = "text-sm font-medium text-burgundy-700 hover:underline",
  onDone,
}: {
  action: () => Promise<ActionResult>;
  label: ReactNode;
  confirmLabel?: string;
  className?: string;
  onDone?: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span role="alert" className="text-sm text-burgundy-800">{error}</span>}
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          setArmed(false);
          start(async () => {
            const result = await action();
            if (result?.error) {
              setError(result.error);
            } else {
              setError(null);
              onDone?.();
              router.refresh();
            }
          });
        }}
      >
        {armed ? confirmLabel : label}
      </button>
    </span>
  );
}
