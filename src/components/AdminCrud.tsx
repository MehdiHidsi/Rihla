"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Eye, Merge, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CompanyAvatar, StatusBadge } from "@/components/ui";
import { Field, FormError } from "@/components/AuthForms";
import {
  deleteCityAction,
  deleteCompanyAction,
  mergeCitiesAction,
  saveCityAction,
  saveCompanyAction,
  type AdminResult,
} from "@/app/admin/actions";
import { CATEGORIES } from "@/lib/utils";

/* ------------------------------ Companies ------------------------------ */
export type CompanyRow = {
  id: number;
  name: string;
  phone: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  description: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  updatedAt: string;
  routes: number;
  cities: string[];
};

const emptyCompany = { name: "", phone: "", website: "", facebook: "", instagram: "", description: "", notes: "", source: "", status: "needs_review" };

export function CompaniesManager({ rows }: { rows: CompanyRow[] }) {
  const router = useRouter();
  const id = useId();
  const [edit, setEdit] = useState<{ id?: number; v: typeof emptyCompany; cities: string[] } | null>(null);
  const [del, setDel] = useState<CompanyRow | null>(null);
  const [res, setRes] = useState<AdminResult>({});
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};

  const openEdit = (r?: CompanyRow) => {
    setRes({});
    setEdit(
      r
        ? { id: r.id, cities: r.cities, v: { name: r.name, phone: r.phone ?? "", website: r.website ?? "", facebook: r.facebook ?? "", instagram: r.instagram ?? "", description: r.description ?? "", notes: r.notes ?? "", source: r.source ?? "", status: r.status } }
        : { v: emptyCompany, cities: [] }
    );
  };
  const set = (k: keyof typeof emptyCompany, val: string) => setEdit((e) => (e ? { ...e, v: { ...e.v, [k]: val } } : e));

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className="btn btn-primary" onClick={() => openEdit()}>
          <Plus size={16} aria-hidden /> Ajouter une compagnie
        </button>
      </div>

      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Compagnie", "Lignes", "Villes desservies", "Contact", "Statut", "Mise à jour", "Actions"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-sand/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CompanyAvatar name={r.name} size={34} />
                    <span className="font-extrabold">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{r.routes}</td>
                <td className="max-w-[220px] px-4 py-3 text-xs text-muted">{r.cities.length ? `${r.cities.length} · ${r.cities.slice(0, 3).join(", ")}${r.cities.length > 3 ? "…" : ""}` : "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{r.phone ?? r.website?.replace(/^https?:\/\//, "") ?? "Non renseigné"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted">{r.updatedAt}</td>
                <td className="px-4 py-3">
                  <RowActions r={r} onEdit={() => openEdit(r)} onDelete={() => { setRes({}); setDel(r); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex items-center gap-3">
              <CompanyAvatar name={r.name} size={40} />
              <div className="flex-1">
                <p className="font-extrabold">{r.name}</p>
                <p className="text-xs text-muted">{r.routes} ligne(s) · {r.updatedAt}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 text-xs text-muted">{r.phone ?? r.website ?? "Contact non renseigné"}</p>
            <div className="mt-3 border-t border-line pt-2">
              <RowActions r={r} onEdit={() => openEdit(r)} onDelete={() => { setRes({}); setDel(r); }} />
            </div>
          </li>
        ))}
      </ul>

      <Modal open={!!edit} title={edit?.id ? "Modifier la compagnie" : "Ajouter une compagnie"} onClose={() => setEdit(null)}>
        {edit && (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await saveCompanyAction({ id: edit.id, ...edit.v });
                setRes(r);
                if (r.ok) {
                  setEdit(null);
                  router.refresh();
                }
              });
            }}
          >
            <FormError message={res.error} />
            <Field label="Nom de la compagnie *" htmlFor={`${id}-n`} error={fe.name}>
              <input id={`${id}-n`} className="field" value={edit.v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!fe.name} aria-describedby={fe.name ? `${id}-n-err` : undefined} />
            </Field>
            <Field label="Logo" htmlFor={`${id}-logo`} hint="Téléversement bientôt disponible : les initiales sont utilisées par défaut.">
              <input id={`${id}-logo`} type="file" disabled className="field" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" htmlFor={`${id}-p`}>
                <input id={`${id}-p`} className="field" value={edit.v.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Site web" htmlFor={`${id}-w`} error={fe.website}>
                <input id={`${id}-w`} className="field" placeholder="https://" value={edit.v.website} onChange={(e) => set("website", e.target.value)} aria-invalid={!!fe.website} aria-describedby={fe.website ? `${id}-w-err` : undefined} />
              </Field>
              <Field label="Facebook" htmlFor={`${id}-f`}>
                <input id={`${id}-f`} className="field" value={edit.v.facebook} onChange={(e) => set("facebook", e.target.value)} />
              </Field>
              <Field label="Instagram" htmlFor={`${id}-i`}>
                <input id={`${id}-i`} className="field" value={edit.v.instagram} onChange={(e) => set("instagram", e.target.value)} />
              </Field>
            </div>
            <Field label="Description" htmlFor={`${id}-d`}>
              <textarea id={`${id}-d`} rows={3} className="field" value={edit.v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div>
              <p className="label">Villes desservies</p>
              <p className="text-sm text-muted">{edit.cities.length ? edit.cities.join(", ") : "Déduites automatiquement des lignes enregistrées."}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Source des données" htmlFor={`${id}-s`}>
                <input id={`${id}-s`} className="field" value={edit.v.source} onChange={(e) => set("source", e.target.value)} />
              </Field>
              <Field label="Statut des données" htmlFor={`${id}-st`}>
                <select id={`${id}-st`} className="field" value={edit.v.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="needs_review">À vérifier</option>
                  <option value="unverified">Non vérifié</option>
                  <option value="verified">Vérifié</option>
                </select>
              </Field>
            </div>
            <Field label="Notes internes" htmlFor={`${id}-no`}>
              <textarea id={`${id}-no`} rows={2} className="field" value={edit.v.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>
                Annuler
              </button>
              <button className="btn btn-primary" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        danger
        title={`Supprimer ${del?.name ?? ""} ?`}
        description="Cette action est définitive. Une compagnie liée à des trajets ne peut pas être supprimée."
        confirmLabel="Supprimer"
        busy={pending}
        onClose={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            const r = await deleteCompanyAction(del!.id);
            setRes(r);
            if (r.ok) {
              setDel(null);
              router.refresh();
            }
          })
        }
      >
        {res.error && <FormError message={res.error} />}
      </ConfirmDialog>
    </>
  );
}

function RowActions({ r, onEdit, onDelete }: { r: CompanyRow; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Link href={`/compagnies/${r.id}`} className="btn btn-ghost btn-sm !px-2" aria-label={`Voir ${r.name}`} title="Voir">
        <Eye size={15} aria-hidden />
      </Link>
      <button className="btn btn-ghost btn-sm !px-2" onClick={onEdit} aria-label={`Modifier ${r.name}`} title="Modifier">
        <Pencil size={15} aria-hidden />
      </button>
      <button className="btn btn-ghost btn-sm !px-2 text-danger" onClick={onDelete} aria-label={`Supprimer ${r.name}`} title="Supprimer">
        <Trash2 size={15} aria-hidden />
      </button>
    </div>
  );
}

/* -------------------------------- Cities -------------------------------- */
export type CityRow = {
  id: number;
  name: string;
  region: string | null;
  category: string | null;
  description: string | null;
  status: string;
  routes: number;
  companies: number;
};

export function CitiesManager({ rows, all }: { rows: CityRow[]; all: { id: number; name: string }[] }) {
  const router = useRouter();
  const id = useId();
  const [edit, setEdit] = useState<{ id?: number; name: string; region: string; category: string; description: string; status: string } | null>(null);
  const [del, setDel] = useState<CityRow | null>(null);
  const [merge, setMerge] = useState<CityRow | null>(null);
  const [target, setTarget] = useState("");
  const [res, setRes] = useState<AdminResult>({});
  const [pending, start] = useTransition();
  const fe = res.fieldErrors ?? {};

  const Actions = ({ r }: { r: CityRow }) => (
    <div className="flex items-center gap-1">
      <button className="btn btn-ghost btn-sm !px-2" aria-label={`Modifier ${r.name}`} title="Modifier" onClick={() => { setRes({}); setEdit({ id: r.id, name: r.name, region: r.region ?? "", category: r.category ?? "", description: r.description ?? "", status: r.status }); }}>
        <Pencil size={15} aria-hidden />
      </button>
      <button className="btn btn-ghost btn-sm !px-2" aria-label={`Fusionner ${r.name}`} title="Fusionner avec une autre ville" onClick={() => { setRes({}); setTarget(""); setMerge(r); }}>
        <Merge size={15} aria-hidden />
      </button>
      <button className="btn btn-ghost btn-sm !px-2 text-danger" aria-label={`Supprimer ${r.name}`} title="Supprimer" onClick={() => { setRes({}); setDel(r); }}>
        <Trash2 size={15} aria-hidden />
      </button>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className="btn btn-primary" onClick={() => { setRes({}); setEdit({ name: "", region: "", category: "", description: "", status: "verified" }); }}>
          <Plus size={16} aria-hidden /> Ajouter une ville
        </button>
      </div>
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs tracking-wide text-muted uppercase">
            <tr>
              {["Ville", "Région", "Lignes", "Compagnies", "Statut", "Actions"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-sand/60">
                <td className="px-4 py-3 font-extrabold">{r.name}</td>
                <td className="px-4 py-3 text-muted">{r.region ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums">{r.routes}</td>
                <td className="px-4 py-3 tabular-nums">{r.companies}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  <Actions r={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-extrabold">{r.name}</p>
                <p className="text-xs text-muted">{r.region ?? "Région non renseignée"}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 text-xs text-muted">{r.routes} liaison(s) · {r.companies} compagnie(s)</p>
            <div className="mt-2 border-t border-line pt-2">
              <Actions r={r} />
            </div>
          </li>
        ))}
      </ul>

      <Modal open={!!edit} title={edit?.id ? "Modifier la ville" : "Ajouter une ville"} onClose={() => setEdit(null)}>
        {edit && (
          <form
            noValidate
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await saveCityAction(edit);
                setRes(r);
                if (r.ok) {
                  setEdit(null);
                  router.refresh();
                }
              });
            }}
          >
            <FormError message={res.error} />
            <Field label="Nom de la ville *" htmlFor={`${id}-n`} error={fe.name}>
              <input id={`${id}-n`} className="field" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} aria-invalid={!!fe.name} aria-describedby={fe.name ? `${id}-n-err` : undefined} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Région" htmlFor={`${id}-r`}>
                <input id={`${id}-r`} className="field" value={edit.region} onChange={(e) => setEdit({ ...edit, region: e.target.value })} />
              </Field>
              <Field label="Catégorie" htmlFor={`${id}-c`}>
                <select id={`${id}-c`} className="field" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                  <option value="">—</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description" htmlFor={`${id}-d`}>
              <textarea id={`${id}-d`} rows={3} className="field" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </Field>
            <Field label="Statut" htmlFor={`${id}-s`}>
              <select id={`${id}-s`} className="field" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="verified">Vérifié</option>
                <option value="needs_review">À vérifier</option>
                <option value="unverified">Non vérifié</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" className="btn btn-outline" onClick={() => setEdit(null)}>
                Annuler
              </button>
              <button className="btn btn-primary" disabled={pending}>
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!merge}
        title={`Fusionner « ${merge?.name ?? ""} »`}
        description="Tous les trajets, lignes et arrêts seront rattachés à la ville cible, puis cette ville sera supprimée."
        confirmLabel="Fusionner"
        busy={pending}
        onClose={() => setMerge(null)}
        onConfirm={() => {
          if (!target) return setRes({ error: "Choisissez la ville cible." });
          start(async () => {
            const r = await mergeCitiesAction(merge!.id, Number(target));
            setRes(r);
            if (r.ok) {
              setMerge(null);
              router.refresh();
            }
          });
        }}
      >
        <label htmlFor={`${id}-t`} className="label">
          Conserver la ville
        </label>
        <select id={`${id}-t`} className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Sélectionnez…</option>
          {all.filter((c) => c.id !== merge?.id).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {res.error && <div className="mt-3"><FormError message={res.error} /></div>}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!del}
        danger
        title={`Supprimer ${del?.name ?? ""} ?`}
        description="La suppression est bloquée si la ville est utilisée par des trajets, lignes ou arrêts."
        confirmLabel="Supprimer"
        busy={pending}
        onClose={() => setDel(null)}
        onConfirm={() =>
          start(async () => {
            const r = await deleteCityAction(del!.id);
            setRes(r);
            if (r.ok) {
              setDel(null);
              router.refresh();
            }
          })
        }
      >
        {res.error && <FormError message={res.error} />}
      </ConfirmDialog>
    </>
  );
}
