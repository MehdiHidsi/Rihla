"use client";

import Link from "next/link";
import { useCallback, useRef, useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Download, FileSpreadsheet, FileWarning, Upload, XCircle } from "lucide-react";
import { importAction, validateImportAction, type ImportCheck, type ImportType } from "@/app/admin/actions";

const TYPES: { k: ImportType | "routes" | "route_stops" | "schedules"; label: string; desc: string; enabled: boolean }[] = [
  { k: "companies", label: "Compagnies", desc: "company_name, phone, website, description, source", enabled: true },
  { k: "cities", label: "Villes", desc: "city_name, region, country", enabled: true },
  { k: "journeys", label: "Trajets", desc: "company_name, departure_city, arrival_city, horaires, prix…", enabled: true },
  { k: "routes", label: "Lignes", desc: "Bientôt disponible", enabled: false },
  { k: "route_stops", label: "Arrêts de ligne", desc: "Bientôt disponible", enabled: false },
  { k: "schedules", label: "Horaires", desc: "Bientôt disponible", enabled: false },
];

const FIELDS: Record<ImportType, { key: string; required?: boolean; label: string }[]> = {
  companies: [
    { key: "company_name", required: true, label: "Nom de la compagnie" },
    { key: "phone", label: "Téléphone" },
    { key: "website", label: "Site web" },
    { key: "description", label: "Description" },
    { key: "source", label: "Source" },
  ],
  cities: [
    { key: "city_name", required: true, label: "Nom de la ville" },
    { key: "region", label: "Région" },
    { key: "country", label: "Pays" },
  ],
  journeys: [
    { key: "company_name", required: true, label: "Compagnie" },
    { key: "departure_city", required: true, label: "Ville de départ" },
    { key: "arrival_city", required: true, label: "Ville d'arrivée" },
    { key: "departure_time", label: "Heure de départ" },
    { key: "arrival_time", label: "Heure d'arrivée" },
    { key: "travel_duration", label: "Durée (min)" },
    { key: "price", label: "Prix" },
    { key: "source", label: "Source" },
    { key: "source_url", label: "Lien source" },
  ],
};

const STEPS = ["Fichier", "Type", "Aperçu", "Colonnes", "Validation", "Erreurs", "Confirmation", "Résultat"];

function parseCsv(text: string): string[][] {
  const first = text.split(/\r?\n/)[0] ?? "";
  const delim = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === delim) {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function CsvImport() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [table, setTable] = useState<string[][]>([]);
  const [type, setType] = useState<ImportType | "">("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [check, setCheck] = useState<ImportCheck | null>(null);
  const [result, setResult] = useState<{ ok: boolean; inserted: number; skipped: number; error?: string } | null>(null);
  const [fileErr, setFileErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [ack, setAck] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const headers = table[0] ?? [];
  const body = table.slice(1);

  const mappedRows = useCallback(() => {
    if (!type) return [];
    const idx: Record<string, number> = {};
    for (const [field, col] of Object.entries(mapping)) if (col !== "") idx[field] = Number(col);
    return body.map((r) => {
      const o: Record<string, string> = {};
      for (const f of FIELDS[type]) o[f.key] = idx[f.key] !== undefined ? (r[idx[f.key]] ?? "").trim() : "";
      return o;
    });
  }, [type, mapping, body]);

  function onFile(f: File | undefined) {
    setFileErr("");
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name)) return setFileErr("Format non supporté : choisissez un fichier .csv.");
    if (f.size > 5_000_000) return setFileErr("Fichier trop volumineux (5 Mo maximum).");
    f.text().then((t) => {
      const parsed = parseCsv(t.replace(/^\uFEFF/, ""));
      if (parsed.length < 2) return setFileErr("Le fichier doit contenir une ligne d'en-têtes et au moins une ligne de données.");
      if (parsed.length > 5001) return setFileErr("Maximum 5 000 lignes par import.");
      setFile({ name: f.name, size: f.size });
      setTable(parsed);
      setStep(1);
    });
  }

  function chooseType(t: ImportType) {
    setType(t);
    const m: Record<string, string> = {};
    FIELDS[t].forEach((f) => {
      const i = headers.findIndex((h) => norm(h) === norm(f.key) || norm(h) === norm(f.label));
      m[f.key] = i >= 0 ? String(i) : "";
    });
    setMapping(m);
    setStep(2);
  }

  const missingRequired = type ? FIELDS[type].filter((f) => f.required && mapping[f.key] === "") : [];

  function runValidation() {
    setStep(4);
    setCheck(null);
    start(async () => {
      const r = await validateImportAction(type as ImportType, mappedRows());
      setCheck(r);
    });
  }

  function runImport() {
    start(async () => {
      const r = await importAction(type as ImportType, mappedRows());
      setResult(r);
      setStep(7);
    });
  }

  function reset() {
    setStep(0);
    setFile(null);
    setTable([]);
    setType("");
    setCheck(null);
    setResult(null);
    setAck(false);
  }

  const errors = check?.issues.filter((i) => i.level === "error") ?? [];
  const warnings = check?.issues.filter((i) => i.level === "warning") ?? [];
  const template = (t: ImportType) => "data:text/csv;charset=utf-8," + encodeURIComponent(FIELDS[t].map((f) => f.key).join(",") + "\n");

  return (
    <div>
      <ol className="mb-6 flex gap-1 overflow-x-auto pb-2" aria-label="Étapes de l'import">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${i === step ? "bg-brand-700 text-white" : i < step ? "bg-brand-50 text-brand-700" : "bg-white text-muted ring-1 ring-line"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${i === step ? "bg-white/20" : i < step ? "bg-brand-700 text-white" : "bg-surface"}`}>{i < step ? <Check size={11} aria-hidden /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <section className="card p-5 sm:p-7" aria-live="polite">
        {step === 0 && (
          <>
            <h2 className="text-xl font-extrabold">1. Téléverser un fichier CSV</h2>
            <p className="mt-1 mb-5 text-sm text-muted">Séparateur virgule ou point-virgule, encodage UTF-8, première ligne = en-têtes.</p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                onFile(e.dataTransfer.files[0]);
              }}
              className={`flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center ${drag ? "border-brand-600 bg-brand-50" : "border-line bg-sand"}`}
            >
              <FileSpreadsheet size={36} className="mb-3 text-brand-700" aria-hidden />
              <p className="font-extrabold">Glissez-déposez votre fichier ici</p>
              <p className="my-1 text-sm text-muted">ou</p>
              <button className="btn btn-primary" onClick={() => input.current?.click()}>
                <Upload size={16} aria-hidden /> Choisir un fichier
              </button>
              <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Choisir un fichier CSV" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            {fileErr && (
              <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-semibold text-danger">
                <FileWarning size={16} aria-hidden /> {fileErr}
              </p>
            )}
            <div className="mt-6 border-t border-line pt-4">
              <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Modèles de fichier</p>
              <div className="flex flex-wrap gap-2">
                {(["companies", "cities", "journeys"] as const).map((t) => (
                  <a key={t} href={template(t)} download={`modele-${t}.csv`} className="btn btn-outline btn-sm">
                    <Download size={14} aria-hidden /> {TYPES.find((x) => x.k === t)?.label}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-extrabold">2. Type de données</h2>
            <p className="mt-1 mb-5 text-sm text-muted">
              Fichier : <strong>{file?.name}</strong> — {body.length} ligne(s) détectée(s).
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TYPES.map((t) => (
                <li key={t.k}>
                  <button disabled={!t.enabled} onClick={() => t.enabled && chooseType(t.k as ImportType)} className="card h-full w-full p-4 text-left hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-line">
                    <span className="flex items-center justify-between font-extrabold">
                      {t.label} {!t.enabled && <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted">À venir</span>}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{t.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-extrabold">3. Aperçu des lignes</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Les 5 premières lignes de « {file?.name} ».</p>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-3 py-2 text-muted">#</th>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-bold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {body.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-muted">{i + 2}</td>
                      {headers.map((_, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap">
                          {r[j] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </>
        )}

        {step === 3 && type && (
          <>
            <h2 className="text-xl font-extrabold">4. Correspondance des colonnes</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Associez chaque champ à une colonne de votre fichier. Les champs * sont obligatoires.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS[type].map((f) => (
                <div key={f.key}>
                  <label htmlFor={`map-${f.key}`} className="label">
                    {f.label} {f.required && "*"} <span className="font-mono normal-case text-[10px]">({f.key})</span>
                  </label>
                  <select id={`map-${f.key}`} className="field" value={mapping[f.key] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })} aria-invalid={f.required && mapping[f.key] === ""}>
                    <option value="">— Ne pas importer —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {missingRequired.length > 0 && (
              <p role="alert" className="mt-4 flex items-center gap-2 text-sm font-semibold text-danger">
                <AlertTriangle size={16} aria-hidden /> Champ(s) obligatoire(s) non associé(s) : {missingRequired.map((f) => f.label).join(", ")}.
              </p>
            )}
            <Nav onBack={() => setStep(2)} onNext={runValidation} nextLabel="Valider les données" disabled={missingRequired.length > 0} />
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-extrabold">5. Validation des données</h2>
            {!check ? (
              <div role="status" className="py-12 text-center text-sm text-muted">
                <div className="skeleton mx-auto mb-3 h-3 w-48" /> Analyse de {body.length} ligne(s) : champs manquants, doublons, villes et compagnies inconnues…
              </div>
            ) : check.error ? (
              <p role="alert" className="mt-4 rounded-lg bg-[#f8e6e3] p-4 text-sm font-semibold text-danger">
                {check.error}
              </p>
            ) : (
              <>
                <dl className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { l: "Lignes lues", v: check.total, c: "" },
                    { l: "Lignes valides", v: check.valid, c: "text-ok" },
                    { l: "Erreurs", v: errors.length, c: errors.length ? "text-danger" : "" },
                    { l: "Avertissements", v: warnings.length, c: warnings.length ? "text-warn" : "" },
                  ].map((x) => (
                    <div key={x.l} className="rounded-lg border border-line bg-sand p-4">
                      <dt className="text-xs font-bold text-muted">{x.l}</dt>
                      <dd className={`text-3xl font-extrabold ${x.c}`}>{x.v}</dd>
                    </div>
                  ))}
                </dl>
                <Nav onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Voir les détails" />
              </>
            )}
          </>
        )}

        {step === 5 && check && (
          <>
            <h2 className="text-xl font-extrabold">6. Erreurs et avertissements</h2>
            {check.issues.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-[#e5f2ea] p-4 text-sm font-semibold text-ok">
                <CheckCircle2 size={18} aria-hidden /> Aucun problème détecté.
              </p>
            ) : (
              <ul className="mt-4 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                {check.issues.slice(0, 200).map((i, k) => (
                  <li key={k} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${i.level === "error" ? "border-[#ecc4be] bg-[#fbeeec] text-danger" : "border-[#efd9a8] bg-amber-soft text-[#6f4710]"}`}>
                    {i.level === "error" ? <XCircle size={15} className="mt-0.5 shrink-0" aria-hidden /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />}
                    <span>
                      <strong>Ligne {i.row}</strong> — {i.message}
                    </span>
                  </li>
                ))}
                {check.issues.length > 200 && <li className="text-xs text-muted">… et {check.issues.length - 200} autre(s).</li>}
              </ul>
            )}
            {check.valid === 0 && (
              <p role="alert" className="mt-4 flex items-center gap-2 text-sm font-bold text-danger">
                <FileWarning size={16} aria-hidden /> Aucune ligne valide : corrigez le fichier puis réimportez-le.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-between gap-2">
              <button className="btn btn-outline" onClick={() => setStep(3)}>
                <ArrowLeft size={15} aria-hidden /> Modifier le mappage
              </button>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={reset}>
                  Choisir un autre fichier
                </button>
                <button className="btn btn-primary" disabled={check.valid === 0} onClick={() => setStep(6)}>
                  Continuer <ArrowRight size={15} aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}

        {step === 6 && check && (
          <>
            <h2 className="text-xl font-extrabold">7. Confirmer l&apos;import</h2>
            <p className="mt-2 text-sm text-muted">
              <strong>{check.valid}</strong> ligne(s) seront importées dans « {TYPES.find((t) => t.k === type)?.label} ». {check.total - check.valid} ligne(s) en erreur ou en doublon seront ignorées.
            </p>
            {type === "journeys" && (
              <p className="mt-3 rounded-lg bg-amber-soft p-3 text-sm text-[#6f4710]">Les trajets importés ne sont jamais marqués « Vérifiés » : ils arrivent « Non vérifiés » ou « À vérifier ».</p>
            )}
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
              <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#0f5037]" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span>Je confirme avoir contrôlé le mappage et le récapitulatif.</span>
            </label>
            <div className="mt-6 flex justify-between gap-2">
              <button className="btn btn-outline" onClick={() => setStep(5)}>
                <ArrowLeft size={15} aria-hidden /> Retour
              </button>
              <button className="btn btn-primary" disabled={!ack || pending} onClick={runImport}>
                {pending ? "Import en cours…" : `Importer ${check.valid} ligne(s)`}
              </button>
            </div>
          </>
        )}

        {step === 7 && result && (
          <div className="py-4 text-center">
            {result.ok ? (
              <>
                <CheckCircle2 size={44} className="mx-auto mb-3 text-ok" aria-hidden />
                <h2 className="text-xl font-extrabold">Import terminé</h2>
                <p className="mt-1 text-sm text-muted">
                  <strong>{result.inserted}</strong> enregistrement(s) ajouté(s) · {result.skipped} ignoré(s).
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link href={type === "companies" ? "/admin/compagnies" : type === "cities" ? "/admin/villes" : "/admin/revue"} className="btn btn-primary">
                    {type === "journeys" ? "Passer à la revue des données" : "Voir les enregistrements"}
                  </Link>
                  <button className="btn btn-outline" onClick={reset}>
                    Nouvel import
                  </button>
                </div>
              </>
            ) : (
              <>
                <XCircle size={44} className="mx-auto mb-3 text-danger" aria-hidden />
                <h2 className="text-xl font-extrabold">Import impossible</h2>
                <p role="alert" className="mt-1 text-sm text-danger">{result.error}</p>
                <button className="btn btn-outline mt-5" onClick={reset}>
                  Recommencer
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel = "Continuer", disabled = false }: { onBack: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean }) {
  return (
    <div className="mt-6 flex justify-between gap-2">
      <button className="btn btn-outline" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden /> Retour
      </button>
      <button className="btn btn-primary" onClick={onNext} disabled={disabled}>
        {nextLabel} <ArrowRight size={15} aria-hidden />
      </button>
    </div>
  );
}
