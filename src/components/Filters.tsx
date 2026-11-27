"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

const SLOTS = [
  { k: "night", label: "Nuit (0h – 5h)" },
  { k: "morning", label: "Matin (5h – 12h)" },
  { k: "afternoon", label: "Après-midi (12h – 18h)" },
  { k: "evening", label: "Soir (18h – 24h)" },
];
const DURS = [
  { v: "", label: "Toutes durées" },
  { v: "120", label: "Moins de 2 h" },
  { v: "240", label: "Moins de 4 h" },
  { v: "360", label: "Moins de 6 h" },
  { v: "600", label: "Moins de 10 h" },
];

function useParamUpdater() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    start(() => router.replace(`${path}?${next.toString()}`, { scroll: false }));
  };
  return { sp, update, pending };
}

function Panel({ companies, hasPrices }: { companies: { id: number; name: string; n: number }[]; hasPrices: boolean }) {
  const { sp, update, pending } = useParamUpdater();
  const co = (sp.get("co") ?? "").split(",").filter(Boolean);
  const slots = (sp.get("slot") ?? "").split(",").filter(Boolean);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const active = ["co", "slot", "dur", "direct"].some((k) => sp.get(k));
  return (
    <div className={`space-y-6 ${pending ? "opacity-70" : ""}`}>
      <fieldset>
        <legend className="label">Compagnie</legend>
        <div className="space-y-1">
          {companies.map((c) => (
            <label key={c.id} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#0f5037]"
                checked={co.includes(String(c.id))}
                onChange={() => update({ co: toggle(co, String(c.id)).join(",") })}
              />
              <span className="flex-1 font-semibold">{c.name}</span>
              <span className="text-xs text-muted">{c.n}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Heure de départ</legend>
        <div className="space-y-1">
          {SLOTS.map((s) => (
            <label key={s.k} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#0f5037]"
                checked={slots.includes(s.k)}
                onChange={() => update({ slot: toggle(slots, s.k).join(",") })}
              />
              <span className="font-semibold">{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="f-dur" className="label">
          Durée du trajet (si connue)
        </label>
        <select id="f-dur" className="field" value={sp.get("dur") ?? ""} onChange={(e) => update({ dur: e.target.value })}>
          {DURS.map((d) => (
            <option key={d.v} value={d.v}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="label">Type de trajet</legend>
        <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#0f5037]"
            checked={sp.get("direct") === "1"}
            onChange={(e) => update({ direct: e.target.checked ? "1" : null })}
          />
          <span className="font-semibold">Sans arrêt intermédiaire</span>
        </label>
      </fieldset>
      {hasPrices ? null : (
        <p className="rounded-lg bg-surface p-3 text-xs text-muted">
          Le filtre par prix sera disponible dès que des tarifs vérifiés seront renseignés.
        </p>
      )}
      {active && (
        <button className="btn btn-outline btn-sm w-full" onClick={() => update({ co: null, slot: null, dur: null, direct: null })}>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

export function Filters(props: { companies: { id: number; name: string; n: number }[]; hasPrices: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside aria-label="Filtres" className="card sticky top-24 hidden p-5 lg:block">
        <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold">
          <SlidersHorizontal size={16} aria-hidden /> Filtres
        </h2>
        <Panel {...props} />
      </aside>
      <button className="btn btn-outline lg:hidden" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <SlidersHorizontal size={16} aria-hidden /> Filtres
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtres">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Filtres</h2>
              <button className="btn btn-ghost !px-2.5" aria-label="Fermer" onClick={() => setOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <Panel {...props} />
            <button className="btn btn-primary mt-6 w-full" onClick={() => setOpen(false)}>
              Voir les résultats
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({ hasPrices }: { hasPrices: boolean }) {
  const { sp, update } = useParamUpdater();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-[13px] font-semibold text-muted">
        Trier par
      </label>
      <select id="sort" className="field !min-h-10 !w-auto !py-1.5" value={sp.get("sort") ?? "departure"} onChange={(e) => update({ sort: e.target.value })}>
        <option value="departure">Heure de départ</option>
        <option value="arrival">Heure d&apos;arrivée</option>
        <option value="duration">Trajet le plus court</option>
        {hasPrices && <option value="price">Prix (tarifs vérifiés)</option>}
      </select>
    </div>
  );
}
