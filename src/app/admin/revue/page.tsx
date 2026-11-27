import Link from "next/link";
import { and, asc, eq, sql, type SQL } from "drizzle-orm";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState, Pagination } from "@/components/ui";
import { ReviewPanel } from "@/components/AdminJourneys";
import { companies, journeys } from "@/db/schema";
import { countJourneys, getJourney, getSchedule, queryJourneys } from "@/lib/queries";
import { toRow } from "@/lib/admin-rows";

export const dynamic = "force-dynamic";
const PAGE = 12;

const FILTERS: { k: string; label: string; where: () => SQL }[] = [
  { k: "needs_review", label: "À vérifier", where: () => eq(journeys.verificationStatus, "needs_review") },
  { k: "missing_departure", label: "Départ manquant", where: () => sql`${journeys.departureTime} is null` },
  { k: "missing_arrival", label: "Arrivée manquante", where: () => sql`${journeys.arrivalTime} is null` },
  { k: "missing_price", label: "Prix manquant", where: () => sql`${journeys.price} is null` },
  { k: "missing_stops", label: "Arrêts manquants", where: () => sql`not exists (select 1 from route_stops rs where rs.route_id = ${journeys.routeId})` },
  { k: "uncertain_company", label: "Compagnie incertaine", where: () => sql`${companies.status} <> 'verified'` },
  {
    k: "duplicate",
    label: "Doublon possible",
    where: () =>
      sql`exists (select 1 from journeys j2 where j2.id <> ${journeys.id} and j2.company_id = ${journeys.companyId} and j2.departure_city_id = ${journeys.departureCityId} and j2.arrival_city_id = ${journeys.arrivalCityId} and j2.departure_time = ${journeys.departureTime})`,
  },
];

export default async function ReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const f = FILTERS.find((x) => x.k === sp.f) ?? FILTERS[0];
  const page = Math.max(1, Number(sp.page) || 1);
  const where = and(f.where(), sql`${journeys.verificationStatus} <> 'rejected'`);
  const [total, rows] = await Promise.all([
    countJourneys(where),
    queryJourneys({ where, order: [asc(journeys.updatedAt)], limit: PAGE, offset: (page - 1) * PAGE }),
  ]);
  const selId = Number(sp.id) || rows[0]?.id;
  const sel = selId ? await getJourney(selId) : null;
  const sched = sel ? await getSchedule(sel.id) : null;
  const q = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ f: f.k, ...(sp.page ? { page: sp.page } : {}), ...patch })) if (v) p.set(k, String(v));
    return `/admin/revue?${p}`;
  };
  const confidence = (r: (typeof rows)[number]) => {
    const missing = [r.departureTime, r.arrivalTime].filter((x) => !x).length;
    if (r.status === "verified") return { l: "Élevée", c: "text-ok" };
    if (r.status === "needs_review" || missing > 0) return { l: "Faible", c: "text-danger" };
    return { l: "Moyenne", c: "text-warn" };
  };

  return (
    <>
      <PageHeader title="Revue des données" subtitle="Vérifiez les trajets incomplets ou incertains. Chaque modification conserve la provenance de la donnée." />
      <nav aria-label="Filtres de revue" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((x) => (
          <Link key={x.k} href={`/admin/revue?f=${x.k}`} aria-current={x.k === f.k ? "true" : undefined} className={`btn btn-sm shrink-0 ${x.k === f.k ? "btn-primary" : "btn-outline"}`}>
            {x.label}
          </Link>
        ))}
      </nav>
      <p className="mb-3 text-sm font-semibold text-muted" aria-live="polite">
        {total} trajet(s) — {f.label}
      </p>
      {rows.length === 0 ? (
        <EmptyState icon={<CheckCircle2 />} title="Rien à réviser ici" text="Aucun trajet ne correspond à ce filtre. Essayez un autre critère." action={<Link href="/admin/revue" className="btn btn-primary">Voir « À vérifier »</Link>} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
          <div>
            <ul className="space-y-2">
              {rows.map((r) => {
                const c = confidence(r);
                const active = r.id === selId;
                return (
                  <li key={r.id}>
                    <Link href={q({ id: r.id })} aria-current={active ? "true" : undefined} className={`card block p-3.5 ${active ? "!border-brand-600 ring-2 ring-brand-200" : "hover:border-brand-500"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-extrabold">
                          {r.depName} → {r.arrName} <span className="font-medium text-muted">· {r.companyName}</span>
                        </p>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span>
                          Problème : <strong className="text-warn">{r.problem ?? "—"}</strong>
                        </span>
                        <span>Source : {r.source ?? "—"}</span>
                        <span>
                          Confiance : <strong className={c.c}>{c.l}</strong>
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 font-bold text-brand-700">
                          <ClipboardCheck size={13} aria-hidden /> Réviser
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE))} hrefFor={(p) => q({ page: p, id: "" })} />
          </div>
          {sel && <ReviewPanel key={`${sel.id}-${sel.updatedAt.getTime()}`} row={toRow(sel, sched?.operatingDays)} />}
        </div>
      )}
    </>
  );
}
