"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export type ApplyOptions = {
  degrees: { id: string; name: string }[];
  programs: { id: string; name: string; degreeId: string }[];
};

type Errors = Partial<Record<"fullName" | "phone" | "email" | "consent" | "form", string>>;

export function ApplyForm({
  locale,
  labels,
  options,
  initialProgramId,
  compact = false,
}: {
  locale: Locale;
  labels: Dictionary["applyForm"];
  options: ApplyOptions;
  initialProgramId?: string;
  compact?: boolean;
}) {
  // На главной форма может быть на странице дважды: встроенная и в модальном окне.
  const uid = useId();
  const initialProgram = options.programs.find((p) => p.id === initialProgramId);
  const [degreeId, setDegreeId] = useState(initialProgram?.degreeId ?? "");
  const [programId, setProgramId] = useState(initialProgram?.id ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const programs = degreeId ? options.programs.filter((p) => p.degreeId === degreeId) : options.programs;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const fullName = String(data.get("fullName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const next: Errors = {};
    if (fullName.length < 3) next.fullName = labels.errorName;
    if (phone.replace(/\D/g, "").length < 10) next.phone = labels.errorPhone;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = labels.errorEmail;
    if (!data.get("consent")) next.consent = labels.errorConsent;
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus("sending");
    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          degreeId,
          programId,
          message: String(data.get("message") ?? ""),
          consent: true,
          website: String(data.get("website") ?? ""),
          locale,
        }),
      });
      if (response.status === 429) throw new Error(labels.errorRate);
      if (!response.ok) throw new Error(labels.errorGeneric);
      setStatus("done");
    } catch (error) {
      setStatus("idle");
      setErrors({ form: error instanceof Error && error.message === labels.errorRate ? labels.errorRate : labels.errorGeneric });
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="animate-pop py-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-burgundy-700" aria-hidden="true" />
        <h3 className="mt-4 text-2xl text-burgundy-950">{labels.successTitle}</h3>
        <p className="mx-auto mt-2 max-w-md text-muted">{labels.successText}</p>
        <button type="button" onClick={() => setStatus("idle")} className="btn btn-outline mt-6">{labels.another}</button>
      </div>
    );
  }

  const fieldError = (key: keyof Errors) =>
    errors[key] ? <p id={`${uid}-${key}-error`} className="mt-1 text-sm text-burgundy-700">{errors[key]}</p> : null;

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor={`${uid}-name`}>{labels.fullName} *</label>
        <input id={`${uid}-name`} name="fullName" className="field" autoComplete="name" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? `${uid}-fullName-error` : undefined} maxLength={200} />
        {fieldError("fullName")}
      </div>
      <div>
        <label className="field-label" htmlFor={`${uid}-phone`}>{labels.phone} *</label>
        <input id={`${uid}-phone`} name="phone" type="tel" className="field" autoComplete="tel" placeholder="+7 7__ ___ __ __" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${uid}-phone-error` : undefined} maxLength={30} />
        {fieldError("phone")}
      </div>
      <div>
        <label className="field-label" htmlFor={`${uid}-email`}>{labels.emailOptional}</label>
        <input id={`${uid}-email`} name="email" type="email" className="field" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-error` : undefined} maxLength={200} />
        {fieldError("email")}
      </div>
      <div>
        <label className="field-label" htmlFor={`${uid}-degree`}>{labels.degree}</label>
        <select
          id={`${uid}-degree`}
          className="field"
          value={degreeId}
          onChange={(e) => {
            setDegreeId(e.target.value);
            setProgramId("");
          }}
        >
          <option value="">{labels.chooseDegree}</option>
          {options.degrees.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor={`${uid}-program`}>{labels.program}</label>
        <select id={`${uid}-program`} className="field" value={programId} onChange={(e) => {
          const id = e.target.value;
          setProgramId(id);
          const program = options.programs.find((p) => p.id === id);
          if (program) setDegreeId(program.degreeId);
        }}>
          <option value="">{labels.chooseProgram}</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {!compact && (
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`${uid}-message`}>{labels.message}</label>
          <textarea id={`${uid}-message`} name="message" rows={3} className="field resize-y" maxLength={2000} />
        </div>
      )}
      {/* Скрытое поле для отсева ботов */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-2.5 text-sm leading-snug text-muted">
          <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 shrink-0 accent-burgundy-700" aria-invalid={!!errors.consent} />
          <span>{labels.consent}</span>
        </label>
        {fieldError("consent")}
      </div>
      {errors.form && <p role="alert" className="text-sm font-medium text-burgundy-700 sm:col-span-2">{errors.form}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={status === "sending"} className="btn btn-primary w-full disabled:opacity-70 sm:w-auto">
          {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {status === "sending" ? labels.sending : labels.submit}
        </button>
      </div>
    </form>
  );
}
