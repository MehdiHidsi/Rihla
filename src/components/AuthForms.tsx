"use client";

import Link from "next/link";
import { useId, useState, useTransition, type ReactNode } from "react";
import { CheckCircle2, Eye, EyeOff, TriangleAlert } from "lucide-react";
import { forgotAction, loginAction, registerAction, type ActionResult } from "@/app/actions";

export function Field({
  label,
  error,
  children,
  hint,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  htmlFor: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-err`} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        className="field pr-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={show}
        className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface"
      >
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#ecc4be] bg-[#f8e6e3] px-3 py-2.5 text-sm font-semibold text-danger">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden /> {message}
    </div>
  );
}

function GoogleButton() {
  return (
    <button type="button" disabled className="btn btn-outline w-full" title="Bientôt disponible">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-4.9 3.4-8.4z" />
        <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.6 24 12 24z" />
        <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.6 11.6 0 0 0 12 0C7.6 0 3.7 2.6 1.8 6.4l3.8 3C6.5 6.7 9 4.8 12 4.8z" />
      </svg>
      Continuer avec Google <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold text-muted">Bientôt</span>
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [res, setRes] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await loginAction({ email, password, next });
          if (r) setRes(r);
        });
      }}
    >
      <FormError message={res.error} />
      <Field label="Adresse e-mail" htmlFor={`${id}-email`} error={res.fieldErrors?.email}>
        <input id={`${id}-email`} type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!res.fieldErrors?.email} placeholder="vous@exemple.ma" />
      </Field>
      <Field label="Mot de passe" htmlFor={`${id}-pw`}>
        <PasswordInput id={`${id}-pw`} value={password} onChange={setPassword} autoComplete="current-password" />
      </Field>
      <div className="text-right">
        <Link href="/mot-de-passe-oublie" className="text-[13px] font-bold text-brand-700 hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleButton />
      <p className="text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-bold text-brand-700 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const id = useId();
  const [v, setV] = useState({ name: "", email: "", password: "", confirm: "", terms: false });
  const [res, setRes] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};
  const set = (k: keyof typeof v, val: string | boolean) => setV((o) => ({ ...o, [k]: val }));
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await registerAction(v);
          if (r) setRes(r);
        });
      }}
    >
      <FormError message={res.error} />
      <Field label="Nom complet" htmlFor={`${id}-name`} error={fe.name}>
        <input id={`${id}-name`} className="field" value={v.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" aria-invalid={!!fe.name} aria-describedby={fe.name ? `${id}-name-err` : undefined} />
      </Field>
      <Field label="Adresse e-mail" htmlFor={`${id}-email`} error={fe.email}>
        <input id={`${id}-email`} type="email" className="field" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={!!fe.email} aria-describedby={fe.email ? `${id}-email-err` : undefined} />
      </Field>
      <Field label="Mot de passe" htmlFor={`${id}-pw`} error={fe.password} hint="8 caractères minimum.">
        <PasswordInput id={`${id}-pw`} value={v.password} onChange={(x) => set("password", x)} error={fe.password} autoComplete="new-password" />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor={`${id}-pw2`} error={fe.confirm}>
        <PasswordInput id={`${id}-pw2`} value={v.confirm} onChange={(x) => set("confirm", x)} error={fe.confirm} autoComplete="new-password" />
      </Field>
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#0f5037]" checked={v.terms} onChange={(e) => set("terms", e.target.checked)} aria-invalid={!!fe.terms} />
          <span>
            J&apos;accepte les{" "}
            <Link href="/a-propos#conditions" className="font-bold text-brand-700 underline">
              conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/a-propos#confidentialite" className="font-bold text-brand-700 underline">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {fe.terms && (
          <p role="alert" className="mt-1 text-xs font-semibold text-danger">
            {fe.terms}
          </p>
        )}
      </div>
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <GoogleButton />
      <p className="text-center text-sm text-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-bold text-brand-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [res, setRes] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  if (res.ok)
    return (
      <div role="status" className="rounded-xl border border-[#c3dfcf] bg-[#e5f2ea] p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 text-ok" size={32} aria-hidden />
        <h2 className="text-lg font-extrabold">Vérifiez votre boîte mail</h2>
        <p className="mt-1 text-sm text-muted">
          Si un compte existe avec l&apos;adresse <strong>{email}</strong>, un lien de réinitialisation vous sera envoyé.
        </p>
        <Link href="/connexion" className="btn btn-primary mt-4">
          Retour à la connexion
        </Link>
      </div>
    );
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setRes(await forgotAction(email)));
      }}
    >
      <Field label="Adresse e-mail" htmlFor={`${id}-email`} error={res.fieldErrors?.email}>
        <input id={`${id}-email`} type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!res.fieldErrors?.email} aria-describedby={res.fieldErrors?.email ? `${id}-email-err` : undefined} />
      </Field>
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
      </button>
      <p className="text-center text-sm">
        <Link href="/connexion" className="font-bold text-brand-700 hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
