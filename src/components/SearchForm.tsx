"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, CalendarDays, MapPin, Navigation, Search, Users } from "lucide-react";
import { addRecentAction } from "@/app/actions";

type Labels = { from: string; to: string; date: string; pax: string; swap: string; submit: string };
const FR: Labels = {
  from: "Ville de départ",
  to: "Destination",
  date: "Date de départ",
  pax: "Passagers",
  swap: "Inverser les villes",
  submit: "Rechercher un trajet",
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function SearchForm({
  cities,
  initial,
  variant = "page",
  labels = FR,
}: {
  cities: string[];
  initial?: { from?: string; to?: string; date?: string; pax?: number };
  variant?: "hero" | "page";
  labels?: Labels;
}) {
  const router = useRouter();
  const id = useId();
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [pax, setPax] = useState(initial?.pax ?? 1);
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const find = (v: string) => cities.find((c) => norm(c) === norm(v));

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const f = find(from);
    const t = find(to);
    const errs: { from?: string; to?: string } = {};
    if (!from.trim()) errs.from = "Choisissez une ville de départ.";
    else if (!f) errs.from = "Ville inconnue : sélectionnez une ville dans la liste.";
    if (!to.trim()) errs.to = "Choisissez une destination.";
    else if (!t) errs.to = "Ville inconnue : sélectionnez une ville dans la liste.";
    else if (f && f === t) errs.to = "La destination doit être différente du départ.";
    setErrors(errs);
    if (errs.from || errs.to || !f || !t) return;
    const qs = new URLSearchParams({ from: f, to: t, pax: String(pax) });
    if (date) qs.set("date", date);
    start(async () => {
      try {
        await addRecentAction({ origin: f, destination: t, date, pax });
      } catch {
        /* l'historique est facultatif */
      }
      router.push(`/rechercher?${qs.toString()}`);
    });
  }

  const wrap =
    variant === "hero"
      ? "rounded-2xl bg-white p-4 shadow-[0_24px_60px_-20px_rgba(8,38,29,0.5)] sm:p-5"
      : "card p-4";

  return (
    <form onSubmit={submit} noValidate className={wrap} aria-label="Recherche de trajet">
      <div className="grid items-start gap-3 lg:grid-cols-[1.25fr_1.25fr_1fr_0.7fr_auto]">
        <div className="relative grid gap-3 lg:contents">
          <div>
            <label htmlFor={`${id}-from`} className="label">
              {labels.from}
            </label>
            <div className="relative">
              <Navigation size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brand-600" aria-hidden />
              <input
                id={`${id}-from`}
                list={`${id}-cities`}
                className="field pl-9 max-lg:pr-12"
                placeholder="Ex. Casablanca"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                autoComplete="off"
                aria-invalid={!!errors.from}
                aria-describedby={errors.from ? `${id}-from-err` : undefined}
              />
            </div>
            {errors.from && (
              <p id={`${id}-from-err`} role="alert" className="mt-1 text-xs font-semibold text-danger">
                {errors.from}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-to`} className="label">
              {labels.to}
            </label>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-amber-brand" aria-hidden />
              <input
                id={`${id}-to`}
                list={`${id}-cities`}
                className="field pl-9 max-lg:pr-12"
                placeholder="Ex. Marrakech"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                autoComplete="off"
                aria-invalid={!!errors.to}
                aria-describedby={errors.to ? `${id}-to-err` : undefined}
              />
            </div>
            {errors.to && (
              <p id={`${id}-to-err`} role="alert" className="mt-1 text-xs font-semibold text-danger">
                {errors.to}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={swap}
            aria-label={labels.swap}
            title={labels.swap}
            className="absolute top-[calc(50%+4px)] right-3 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-brand-700 shadow-sm hover:bg-brand-50 lg:hidden"
          >
            <ArrowUpDown size={16} aria-hidden />
          </button>
        </div>
        <div>
          <label htmlFor={`${id}-date`} className="label">
            {labels.date}
          </label>
          <div className="relative">
            <CalendarDays size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
            <input id={`${id}-date`} type="date" min={today} className="field pl-9" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-pax`} className="label">
            {labels.pax}
          </label>
          <div className="relative">
            <Users size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
            <select id={`${id}-pax`} className="field pl-9" value={pax} onChange={(e) => setPax(Number(e.target.value))}>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="lg:pt-[26px]">
          <button type="submit" disabled={pending} className="btn btn-amber h-11 w-full lg:w-auto">
            <Search size={17} aria-hidden /> {pending ? "Recherche…" : labels.submit}
          </button>
        </div>
      </div>
      <datalist id={`${id}-cities`}>
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={swap}
        className="mt-3 hidden items-center gap-1.5 text-[13px] font-bold text-brand-700 hover:underline lg:inline-flex"
      >
        <ArrowUpDown size={14} aria-hidden /> {labels.swap}
      </button>
    </form>
  );
}
