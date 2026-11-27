"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { BadgeCheck, Copy, ExternalLink, MoreHorizontal, Pencil, Plus, Trash2, TriangleAlert, ClipboardCheck, XCircle, Info } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge, CompanyAvatar } from "@/components/ui";
import { Field, FormError } from "@/components/AuthForms";
import {
  bulkJourneysAction,
  deleteJourneyAction,
  duplicateJourneyAction,
  saveJourneyAction,
  setJourneyStatusAction,
  type AdminResult,
  type JourneyInput,
} from "@/app/admin/actions";

export type AdminJourneyRow = {
  id: number;
  companyId: number;
  companyName: string;
  depId: number;
  depName: string;
  arrId: number;
  arrName: string;
  departureTime: string | null;
  arrivalTime: string | null;
  duration: number | null;
  price: string | null;
  source: string | null;
  sourceUrl: string | null;
  problem: string | null;
  notes: string | null;
  status: string;
  stops: string[];
  updatedAt: string;
  operatingDays?: string | null;
};

/* ----------------------------- Table + bulk ----------------------------- */
export function JourneysTable({ rows }: { rows: AdminJourneyRow[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [del, setDel] = useState<{ ids: number[] } | null>(null);
  const [pending, start] = useTransition();
  const allChecked = rows.length > 0 && sel.length === rows.length;
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const run = (fn: () => Promise<AdminResult>, ok: string) =>
    start(async () => {
      const r = await fn();
      if (r.error && !r.ok) setMsg({ type: "err", text: r.error });
      else setMsg({ type: r.error ? "err" : "ok", text: r.error ?? ok });
      setSel([]);
      setDel(null);
      router.refresh();
    });

  const Menu = ({ r }: { r: AdminJourneyRow }) => (
    <details className="relative">
      <summary className="btn btn-ghost btn-sm !px-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden" aria-label={`Plus d'actions pour le trajet ${r.id}`}>
        <MoreHorizontal size={16} aria-hidden />
      </summary>
      <div className="card absolute right-0 z-20 mt-1 w-52 p-1 shadow-lg">
        {[
          { l: "Dupliquer", i: Copy, f: () => run(() => duplicateJourneyAction(r.id), "Trajet dupliqué (statut « Non vérifié »).") },
          { l: "Marquer vérifié", i: BadgeCheck, f: () => run(() => setJourneyStatusAction(r.id, "verified"), "Trajet marqué comme vérifié.") },
          { l: "Marquer à vérifier", i: TriangleAlert, f: () => run(() => setJourneyStatusAction(r.id, "needs_review"), "Trajet marqué à vérifier.") },
        ].map((a) => (
          <button key={a.l} onClick={a.f} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-surface">
            <a.i size={14} aria-hidden /> {a.l}
          </button>
        ))}
        <Link href={`/admin/revue?id=${r.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface">
          <ClipboardCheck size={14} aria-hidden /> Réviser
        </Link>
        <button onClick={() => setDel({ ids: [r.id] })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-surface">
          <Trash2 size={14} aria-hidden /> Supprimer
        </button>
      </div>
    </details>
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div role="status" className="min-h-9 text-sm">
          {msg && <span className={`font-semibold ${msg.type === "ok" ? "text-ok" : "text-warn"}`}>{msg.text}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {sel.length > 0 && (
            <>
              <span className="self-center text-sm font-bold">{sel.length} sélectionné(s)</span>
              <button className="btn btn-outline btn-sm" disabled={pending} onClick={() => run(() => bulkJourneysAction(sel, "verify"), "Trajets vérifiés.")}>
                <BadgeCheck size={14} aria-hidden /> Marquer vérifiés
              </button>
              <button className="btn btn-outline btn-sm" disabled={pending} onClick={() => run(() => bulkJourneysAction(sel, "review"), "Trajets marqués à vérifier.")}>
                <TriangleAlert size={14} aria-hidden /> À vérifier
              </button>
              <button className="btn btn-outline btn-sm text-danger" onClick={() => setDel({ ids: sel })}>
                <Trash2 size={14} aria-hidden /> Supprimer
              </button>
            </>
          )}
          <Link href="/admin/trajets/nouveau" className="btn btn-primary btn-sm">
            <Plus size={15} aria-hidden /> Ajouter un trajet
          </Link>
        </div>
      </div>

      <div className="card hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-surface text-[11px] tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="w-10 px-3 py-3">
                  <input type="checkbox" className="h-4 w-4 accent-[#0f5037]" aria-label="Tout sélectionner" checked={allChecked} onChange={() => setSel(allChecked ? [] : rows.map((r) => r.id))} />
                </th>
                {["Compagnie", "Départ", "Arrivée", "Heures", "Arrêts", "Prix", "Source", "Statut", "Mise à jour", ""].map((h, i) => (
                  <th key={i} scope="col" className={`px-3 py-3 font-bold ${h === "Source" || h === "Mise à jour" || h === "Arrêts" ? "hidden 2xl:table-cell" : ""}`}>
                    {h}
                    {h === "" && <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={sel.includes(r.id) ? "bg-brand-50/60" : "hover:bg-sand/60"}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" className="h-4 w-4 accent-[#0f5037]" aria-label={`Sélectionner le trajet ${r.id}`} checked={sel.includes(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2 font-bold">
                      <CompanyAvatar name={r.companyName} size={24} /> {r.companyName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{r.depName}</td>
                  <td className="px-3 py-2.5">{r.arrName}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    <span className="font-bold">{r.departureTime ?? <em className="text-warn not-italic">—</em>}</span> → {r.arrivalTime ?? <em className="text-warn not-italic">—</em>}
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted 2xl:table-cell">{r.stops.length ? r.stops.length : "—"}</td>
                  <td className="px-3 py-2.5 text-muted">{r.price ? `${Number(r.price)} DH` : "—"}</td>
                  <td className="hidden max-w-[150px] truncate px-3 py-2.5 text-muted 2xl:table-cell">{r.source ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted 2xl:table-cell">{r.updatedAt}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center">
                      <Link href={`/admin/trajets/${r.id}`} className="btn btn-ghost btn-sm !px-2" aria-label={`Modifier le trajet ${r.id}`}>
                        <Pencil size={14} aria-hidden />
                      </Link>
                      <Menu r={r} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[#0f5037]" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} aria-label={`Sélectionner le trajet ${r.id}`} />
                <span>
                  <span className="block font-extrabold">
                    {r.depName} → {r.arrName}
                  </span>
                  <span className="block text-xs text-muted">{r.companyName}</span>
                </span>
              </label>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 text-sm tabular-nums">
              <strong>{r.departureTime ?? "Départ ?"}</strong> → {r.arrivalTime ?? "Arrivée ?"} · {r.price ? `${Number(r.price)} DH` : "Prix non renseigné"}
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <Link href={`/admin/trajets/${r.id}`} className="btn btn-outline btn-sm">
                <Pencil size={13} aria-hidden /> Modifier
              </Link>
              <Menu r={r} />
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!del}
        danger
        title={`Supprimer ${del?.ids.length ?? 0} trajet(s) ?`}
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        busy={pending}
        onClose={() => setDel(null)}
        onConfirm={() => run(() => (del!.ids.length === 1 ? deleteJourneyAction(del!.ids[0]) : bulkJourneysAction(del!.ids, "delete")), "Suppression effectuée.")}
      />
    </>
  );
}

/* -------------------------------- Editor -------------------------------- */
type Opt = { id: number; name: string };

export function JourneyEditor({
  initial,
  companies,
  cities,
  meta,
}: {
  initial: AdminJourneyRow | null;
  companies: Opt[];
  cities: Opt[];
  meta?: { createdAt: string; updatedAt: string };
}) {
  const router = useRouter();
  const id = useId();
  const [v, setV] = useState({
    companyId: String(initial?.companyId ?? ""),
    depId: String(initial?.depId ?? ""),
    arrId: String(initial?.arrId ?? ""),
    departureTime: initial?.departureTime ?? "",
    arrivalTime: initial?.arrivalTime ?? "",
    duration: initial?.duration ? String(initial.duration) : "",
    price: initial?.price ? String(Number(initial.price)) : "",
    source: initial?.source ?? "",
    sourceUrl: initial?.sourceUrl ?? "",
    status: initial?.status ?? "unverified",
    problem: initial?.problem ?? "",
    notes: initial?.notes ?? "",
    operatingDays: initial?.operatingDays ?? "",
  });
  const [res, setRes] = useState<AdminResult>({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};
  const set = (k: keyof typeof v, val: string) => setV((o) => ({ ...o, [k]: val }));

  const payload = (): JourneyInput => ({ id: initial?.id, ...v, companyId: Number(v.companyId), depId: Number(v.depId), arrId: Number(v.arrId) });
  const err = (k: string) => (fe[k] ? { "aria-invalid": true, "aria-describedby": `${id}-${k}-err` } : {});

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveJourneyAction(payload());
          setRes(r);
          if (r.ok) {
            if (!initial) router.push(`/admin/trajets/${r.id}`);
            else router.refresh();
          }
        });
      }}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <div className="space-y-6">
        {res.ok && (
          <div role="status" className="rounded-lg border border-[#c3dfcf] bg-[#e5f2ea] px-4 py-3 text-sm font-semibold text-ok">
            Trajet enregistré.
          </div>
        )}
        <FormError message={res.error} />
        <section className="card p-5">
          <h2 className="mb-4 text-base font-extrabold">Liaison</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Compagnie *" htmlFor={`${id}-companyId`} error={fe.companyId}>
              <select id={`${id}-companyId`} className="field" value={v.companyId} onChange={(e) => set("companyId", e.target.value)} {...err("companyId")}>
                <option value="">Sélectionnez…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ville de départ *" htmlFor={`${id}-depId`} error={fe.depId}>
              <select id={`${id}-depId`} className="field" value={v.depId} onChange={(e) => set("depId", e.target.value)} {...err("depId")}>
                <option value="">Sélectionnez…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ville d'arrivée *" htmlFor={`${id}-arrId`} error={fe.arrId}>
              <select id={`${id}-arrId`} className="field" value={v.arrId} onChange={(e) => set("arrId", e.target.value)} {...err("arrId")}>
                <option value="">Sélectionnez…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 text-base font-extrabold">Horaires, durée et prix</h2>
          <p className="mb-4 text-xs text-muted">Laissez vide ce qui n&apos;est pas connu : l&apos;interface publique affichera « non renseigné ».</p>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Heure de départ" htmlFor={`${id}-departureTime`} error={fe.departureTime}>
              <input id={`${id}-departureTime`} className="field" placeholder="HH:MM" value={v.departureTime} onChange={(e) => set("departureTime", e.target.value)} {...err("departureTime")} />
            </Field>
            <Field label="Heure d'arrivée" htmlFor={`${id}-arrivalTime`} error={fe.arrivalTime}>
              <input id={`${id}-arrivalTime`} className="field" placeholder="HH:MM" value={v.arrivalTime} onChange={(e) => set("arrivalTime", e.target.value)} {...err("arrivalTime")} />
            </Field>
            <Field label="Durée (min)" htmlFor={`${id}-duration`} error={fe.duration}>
              <input id={`${id}-duration`} inputMode="numeric" className="field" value={v.duration} onChange={(e) => set("duration", e.target.value)} {...err("duration")} />
            </Field>
            <Field label="Prix (DH)" htmlFor={`${id}-price`} error={fe.price}>
              <input id={`${id}-price`} inputMode="decimal" className="field" value={v.price} onChange={(e) => set("price", e.target.value)} {...err("price")} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Jours de circulation" htmlFor={`${id}-op`}>
              <input id={`${id}-op`} className="field" placeholder="Ex. Tous les jours" value={v.operatingDays} onChange={(e) => set("operatingDays", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-base font-extrabold">Provenance de la donnée</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source" htmlFor={`${id}-source`}>
              <input id={`${id}-source`} className="field" value={v.source} onChange={(e) => set("source", e.target.value)} />
            </Field>
            <Field label="Lien de la source" htmlFor={`${id}-sourceUrl`}>
              <input id={`${id}-sourceUrl`} className="field" placeholder="https://" value={v.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Problème identifié" htmlFor={`${id}-problem`}>
              <input id={`${id}-problem`} className="field" value={v.problem} onChange={(e) => set("problem", e.target.value)} />
            </Field>
            <Field label="Notes internes" htmlFor={`${id}-notes`}>
              <input id={`${id}-notes`} className="field" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="card p-5">
          <h2 className="mb-3 text-base font-extrabold">Vérification</h2>
          <Field label="Statut" htmlFor={`${id}-status`} error={fe.status}>
            <select id={`${id}-status`} className="field" value={v.status} onChange={(e) => set("status", e.target.value)} {...err("status")}>
              <option value="unverified">Non vérifié</option>
              <option value="needs_review">À vérifier</option>
              <option value="verified">Vérifié</option>
              <option value="rejected">Rejeté</option>
            </select>
          </Field>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-soft p-3 text-xs text-[#6f4710]">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden /> « Vérifié » exige une heure de départ et une source. Une donnée incertaine n&apos;est jamais validée automatiquement.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button className="btn btn-primary" disabled={pending}>
              {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer le trajet"}
            </button>
            <Link href="/admin/trajets" className="btn btn-outline">
              Retour à la liste
            </Link>
            {initial && (
              <>
                <button type="button" className="btn btn-outline" onClick={() => start(async () => { const r = await duplicateJourneyAction(initial.id); if (r.ok) router.push(`/admin/trajets/${r.id}`); else setRes(r); })}>
                  <Copy size={15} aria-hidden /> Dupliquer
                </button>
                <button type="button" className="btn btn-outline text-danger" onClick={() => setConfirmDel(true)}>
                  <Trash2 size={15} aria-hidden /> Supprimer
                </button>
              </>
            )}
          </div>
        </section>
        {meta && (
          <section className="card p-5 text-xs text-muted">
            <p>Créé le {meta.createdAt}</p>
            <p>Dernière mise à jour : {meta.updatedAt}</p>
            {v.sourceUrl && (
              <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold text-brand-700">
                Ouvrir la source <ExternalLink size={12} aria-hidden />
              </a>
            )}
          </section>
        )}
      </aside>

      <ConfirmDialog
        open={confirmDel}
        danger
        title="Supprimer ce trajet ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        busy={pending}
        onClose={() => setConfirmDel(false)}
        onConfirm={() => start(async () => { const r = await deleteJourneyAction(initial!.id); if (r.ok) router.push("/admin/trajets"); else setRes(r); setConfirmDel(false); })}
      />
    </form>
  );
}

/* ------------------------------ Review panel ----------------------------- */
export function ReviewPanel({ row }: { row: AdminJourneyRow }) {
  const router = useRouter();
  const id = useId();
  const [v, setV] = useState({
    departureTime: row.departureTime ?? "",
    arrivalTime: row.arrivalTime ?? "",
    duration: row.duration ? String(row.duration) : "",
    price: row.price ? String(Number(row.price)) : "",
    source: row.source ?? "",
    sourceUrl: row.sourceUrl ?? "",
    notes: row.notes ?? "",
  });
  const [checked, setChecked] = useState(false);
  const [res, setRes] = useState<AdminResult>({});
  const [done, setDone] = useState("");
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};
  const set = (k: keyof typeof v, val: string) => setV((o) => ({ ...o, [k]: val }));
  const base = (status: string): JourneyInput => ({
    id: row.id,
    companyId: row.companyId,
    depId: row.depId,
    arrId: row.arrId,
    ...v,
    status,
    problem: status === "verified" ? "" : (row.problem ?? ""),
    operatingDays: row.operatingDays ?? "",
  });
  const act = (fn: () => Promise<AdminResult>, text: string) =>
    start(async () => {
      const r = await fn();
      setRes(r);
      if (r.ok) {
        setDone(text);
        router.refresh();
      }
    });

  return (
    <section className="card sticky top-24 p-5" aria-label="Revue du trajet">
      <h2 className="text-lg font-extrabold">
        {row.depName} → {row.arrName}
      </h2>
      <p className="mb-4 text-sm text-muted">
        {row.companyName} · trajet n° {row.id}
      </p>

      <div className="mb-5 rounded-lg border border-line bg-surface p-3 text-xs">
        <p className="mb-1.5 font-bold tracking-wide uppercase text-muted">Données d&apos;origine (source)</p>
        <dl className="grid grid-cols-[110px_1fr] gap-y-1">
          <dt className="text-muted">Source</dt>
          <dd className="font-semibold">{row.source ?? "—"}</dd>
          <dt className="text-muted">Lien</dt>
          <dd className="font-semibold break-all">{row.sourceUrl ? <a className="text-brand-700 underline" href={row.sourceUrl} target="_blank" rel="noopener noreferrer">{row.sourceUrl}</a> : "—"}</dd>
          <dt className="text-muted">Horaires importés</dt>
          <dd className="font-semibold tabular-nums">
            {row.departureTime ?? "?"} → {row.arrivalTime ?? "?"}
          </dd>
          <dt className="text-muted">Problème</dt>
          <dd className="font-semibold text-warn">{row.problem ?? "Aucun signalé"}</dd>
          <dt className="text-muted">Mise à jour</dt>
          <dd>{row.updatedAt}</dd>
        </dl>
      </div>

      <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Données normalisées (modifiables)</p>
      <FormError message={res.error} />
      {done && !res.error && <p role="status" className="mb-2 text-sm font-semibold text-ok">{done}</p>}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Field label="Départ" htmlFor={`${id}-d`} error={fe.departureTime}>
          <input id={`${id}-d`} className="field" placeholder="HH:MM" value={v.departureTime} onChange={(e) => set("departureTime", e.target.value)} />
        </Field>
        <Field label="Arrivée" htmlFor={`${id}-a`} error={fe.arrivalTime}>
          <input id={`${id}-a`} className="field" placeholder="HH:MM" value={v.arrivalTime} onChange={(e) => set("arrivalTime", e.target.value)} />
        </Field>
        <Field label="Durée (min)" htmlFor={`${id}-du`} error={fe.duration}>
          <input id={`${id}-du`} className="field" value={v.duration} onChange={(e) => set("duration", e.target.value)} />
        </Field>
        <Field label="Prix (DH)" htmlFor={`${id}-p`} error={fe.price}>
          <input id={`${id}-p`} className="field" value={v.price} onChange={(e) => set("price", e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Source" htmlFor={`${id}-s`}>
          <input id={`${id}-s`} className="field" value={v.source} onChange={(e) => set("source", e.target.value)} />
        </Field>
        <Field label="Lien de la source" htmlFor={`${id}-su`}>
          <input id={`${id}-su`} className="field" value={v.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} />
        </Field>
        <Field label="Notes de revue" htmlFor={`${id}-n`}>
          <textarea id={`${id}-n`} rows={2} className="field" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#0f5037]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>J&apos;ai confronté ces informations à la source indiquée.</span>
      </label>
      {fe.status && <p role="alert" className="mt-1 text-xs font-semibold text-danger">{fe.status}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn btn-outline" disabled={pending} onClick={() => act(() => saveJourneyAction(base(row.status === "verified" ? "verified" : "needs_review")), "Modifications enregistrées.")}>
          Enregistrer
        </button>
        <button
          className="btn btn-primary"
          disabled={pending || !checked}
          title={checked ? "" : "Cochez la case de confirmation"}
          onClick={() => act(() => saveJourneyAction(base("verified")), "Trajet marqué comme vérifié.")}
        >
          <BadgeCheck size={15} aria-hidden /> Marquer vérifié
        </button>
        <button className="btn btn-outline text-danger" disabled={pending} onClick={() => act(() => setJourneyStatusAction(row.id, "rejected"), "Trajet rejeté.")}>
          <XCircle size={15} aria-hidden /> Rejeter
        </button>
      </div>
    </section>
  );
}
