"use client";

import { useId, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { changePasswordAction, deleteAccountAction, updateProfileAction, type ActionResult } from "@/app/actions";
import { Field, FormError, PasswordInput } from "@/components/AuthForms";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function ProfileForm({ name: n0, email: e0 }: { name: string; email: string }) {
  const id = useId();
  const [name, setName] = useState(n0);
  const [email, setEmail] = useState(e0);
  const [res, setRes] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};
  return (
    <form
      noValidate
      className="max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setRes(await updateProfileAction({ name, email })));
      }}
    >
      {res.ok && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-[#c3dfcf] bg-[#e5f2ea] px-3 py-2.5 text-sm font-semibold text-ok">
          <CheckCircle2 size={16} aria-hidden /> Profil mis à jour.
        </div>
      )}
      <FormError message={res.error} />
      <Field label="Nom complet" htmlFor={`${id}-n`} error={fe.name}>
        <input id={`${id}-n`} className="field" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fe.name} aria-describedby={fe.name ? `${id}-n-err` : undefined} />
      </Field>
      <Field label="Adresse e-mail" htmlFor={`${id}-e`} error={fe.email}>
        <input id={`${id}-e`} type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fe.email} aria-describedby={fe.email ? `${id}-e-err` : undefined} />
      </Field>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const id = useId();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [res, setRes] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};
  return (
    <form
      noValidate
      className="max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changePasswordAction({ current: cur, next });
          setRes(r);
          if (r.ok) {
            setCur("");
            setNext("");
          }
        });
      }}
    >
      {res.ok && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-[#c3dfcf] bg-[#e5f2ea] px-3 py-2.5 text-sm font-semibold text-ok">
          <CheckCircle2 size={16} aria-hidden /> Mot de passe modifié.
        </div>
      )}
      <FormError message={res.error && !res.fieldErrors ? res.error : undefined} />
      <Field label="Mot de passe actuel" htmlFor={`${id}-c`} error={fe.current}>
        <PasswordInput id={`${id}-c`} value={cur} onChange={setCur} error={fe.current} autoComplete="current-password" />
      </Field>
      <Field label="Nouveau mot de passe" htmlFor={`${id}-x`} error={fe.next} hint="8 caractères minimum.">
        <PasswordInput id={`${id}-x`} value={next} onChange={setNext} error={fe.next} autoComplete="new-password" />
      </Field>
      <button className="btn btn-outline" disabled={pending}>
        Modifier le mot de passe
      </button>
    </form>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button className="btn btn-outline !border-[#ecc4be] text-danger" onClick={() => setOpen(true)}>
        Supprimer mon compte
      </button>
      <ConfirmDialog
        open={open}
        danger
        title="Supprimer définitivement votre compte ?"
        description="Vos favoris et recherches seront effacés. Cette action est irréversible."
        confirmLabel="Supprimer mon compte"
        busy={pending}
        onClose={() => setOpen(false)}
        onConfirm={() => start(async () => void (await deleteAccountAction()))}
      />
    </>
  );
}
