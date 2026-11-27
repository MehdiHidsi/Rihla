"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitReportAction, type ActionResult } from "@/app/actions";
import { Field, FormError } from "@/components/AuthForms";

const ISSUES = [
  "Horaire incorrect",
  "Arrêt incorrect",
  "Ville incorrecte",
  "Informations de la compagnie incorrectes",
  "Autre",
];

function Success({ title, text, onReset }: { title: string; text: string; onReset: () => void }) {
  return (
    <div role="status" className="rounded-xl border border-[#c3dfcf] bg-[#e5f2ea] p-6 text-center">
      <CheckCircle2 className="mx-auto mb-2 text-ok" size={34} aria-hidden />
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{text}</p>
      <button className="btn btn-outline mt-4" onClick={onReset}>
        Envoyer un autre message
      </button>
    </div>
  );
}

export function ReportForm({ defaults }: { defaults: { route?: string; company?: string; journeyId?: number } }) {
  const id = useId();
  const [v, setV] = useState({ route: defaults.route ?? "", company: defaults.company ?? "", issue: "", description: "", email: "" });
  const [res, setRes] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};
  const set = (k: keyof typeof v, val: string) => setV((o) => ({ ...o, [k]: val }));
  if (res.ok)
    return (
      <Success
        title="Merci, votre signalement est envoyé"
        text="Notre équipe vérifiera l'information et mettra à jour la fiche si nécessaire."
        onReset={() => {
          setRes({});
          setV({ route: "", company: "", issue: "", description: "", email: "" });
        }}
      />
    );
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () =>
          setRes(
            await submitReportAction({
              kind: "report",
              journeyId: defaults.journeyId,
              route: v.route,
              companyName: v.company,
              issueType: v.issue,
              description: v.description,
              email: v.email,
            })
          )
        );
      }}
    >
      <FormError message={res.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Trajet concerné" htmlFor={`${id}-r`}>
          <input id={`${id}-r`} className="field" placeholder="Ex. Casablanca → Marrakech" value={v.route} onChange={(e) => set("route", e.target.value)} />
        </Field>
        <Field label="Compagnie" htmlFor={`${id}-c`}>
          <input id={`${id}-c`} className="field" placeholder="Ex. CTM" value={v.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
      </div>
      <Field label="Type de problème" htmlFor={`${id}-i`} error={fe.issueType}>
        <select id={`${id}-i`} className="field" value={v.issue} onChange={(e) => set("issue", e.target.value)} aria-invalid={!!fe.issueType} aria-describedby={fe.issueType ? `${id}-i-err` : undefined}>
          <option value="">Sélectionnez…</option>
          {ISSUES.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </Field>
      <Field label="Description" htmlFor={`${id}-d`} error={fe.description}>
        <textarea id={`${id}-d`} rows={4} className="field" value={v.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!fe.description} aria-describedby={fe.description ? `${id}-d-err` : undefined} placeholder="Décrivez l'erreur et, si possible, l'information correcte." />
      </Field>
      <Field label="E-mail (facultatif)" htmlFor={`${id}-e`} error={fe.email} hint="Pour vous répondre si nous avons besoin de précisions.">
        <input id={`${id}-e`} type="email" className="field" value={v.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!fe.email} aria-describedby={fe.email ? `${id}-e-err` : undefined} />
      </Field>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le signalement"}
      </button>
    </form>
  );
}

export function FeedbackForm() {
  const id = useId();
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [res, setRes] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};
  if (res.ok)
    return (
      <Success
        title="Merci pour votre avis"
        text="Chaque retour nous aide à améliorer Rihla Maroc."
        onReset={() => {
          setRes({});
          setDescription("");
        }}
      />
    );
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setRes(await submitReportAction({ kind: "feedback", description, email })));
      }}
    >
      <FormError message={res.error} />
      <Field label="Votre message" htmlFor={`${id}-d`} error={fe.description}>
        <textarea id={`${id}-d`} rows={4} className="field" value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!fe.description} aria-describedby={fe.description ? `${id}-d-err` : undefined} placeholder="Une idée, une suggestion, un trajet à ajouter ?" />
      </Field>
      <Field label="E-mail (facultatif)" htmlFor={`${id}-e`} error={fe.email}>
        <input id={`${id}-e`} type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fe.email} aria-describedby={fe.email ? `${id}-e-err` : undefined} />
      </Field>
      <button className="btn btn-primary" disabled={pending}>
        Envoyer mon avis
      </button>
    </form>
  );
}
