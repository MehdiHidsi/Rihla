import Link from "next/link";
import { Building2, MapPin, Route as RouteIcon, Bus, ClipboardCheck, Clock, FlaskConical } from "lucide-react";
import { adminStats } from "@/lib/queries";
import { PageHeader, StatusBadge } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Bars({ data, empty }: { data: { name: string; n: number }[]; empty: string }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  if (!data.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.name} className="grid grid-cols-[100px_1fr_36px] items-center gap-3 text-sm">
          <span className="truncate font-semibold">{d.name}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-surface">
            <span className="block h-full rounded-full bg-brand-600" style={{ width: `${(d.n / max) * 100}%` }} />
          </span>
          <span className="text-right text-xs font-bold tabular-nums">{d.n}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminDashboard() {
  const s = await adminStats();
  const cards = [
    { l: "Compagnies", v: s.nCompanies, i: Building2, h: "/admin/compagnies" },
    { l: "Villes", v: s.nCities, i: MapPin, h: "/admin/villes" },
    { l: "Lignes", v: s.nRoutes, i: RouteIcon, h: "/admin/routes" },
    { l: "Trajets", v: s.nJourneys, i: Bus, h: "/admin/trajets" },
    { l: "Trajets à vérifier", v: s.nReview, i: ClipboardCheck, h: "/admin/revue", warn: true },
    { l: "Horaires incomplets", v: s.nIncomplete, i: Clock, h: "/admin/revue?f=missing_arrival", warn: true },
  ];
  const totalV = s.verif.reduce((a, b) => a + b.n, 0) || 1;
  const vColors: Record<string, string> = { verified: "#2f7d4f", unverified: "#9aa39c", needs_review: "#d29a3a", rejected: "#b3392f" };
  const vLabels: Record<string, string> = { verified: "Vérifiés", unverified: "Non vérifiés", needs_review: "À vérifier", rejected: "Rejetés" };

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la base de données, calculée à partir des enregistrements actuels."
        actions={
          <>
            <Link href="/admin/import" className="btn btn-outline">
              Importer un CSV
            </Link>
            <Link href="/admin/trajets/nouveau" className="btn btn-primary">
              Ajouter un trajet
            </Link>
          </>
        }
      />
      <div role="note" className="mb-6 flex items-start gap-2 rounded-lg border border-[#efd9a8] bg-amber-soft px-3 py-2 text-[13px] text-[#6f4710]">
        <FlaskConical size={16} className="mt-0.5 shrink-0" aria-hidden />
        La base contient actuellement des enregistrements de démonstration (source « Données de démonstration »). Les indicateurs ci-dessous sont réellement calculés.
      </div>

      <ul className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <li key={c.l}>
            <Link href={c.h} className="card block p-4 hover:border-brand-500">
              <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${c.warn ? "bg-amber-soft text-amber-brand" : "bg-brand-50 text-brand-700"}`}>
                <c.i size={18} aria-hidden />
              </span>
              <p className="text-3xl font-extrabold tabular-nums">{c.v}</p>
              <p className="text-xs font-semibold text-muted">{c.l}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold">Trajets par ville de départ</h2>
          <Bars data={s.byCity} empty="Aucun trajet enregistré." />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold">Compagnies avec le plus de lignes</h2>
          <Bars data={s.byCompany} empty="Aucune ligne enregistrée." />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold">Statut de vérification</h2>
          <div className="mb-4 flex h-4 overflow-hidden rounded-full bg-surface" role="img" aria-label="Répartition des statuts de vérification">
            {s.verif.map((v) => (
              <span key={v.status} style={{ width: `${(v.n / totalV) * 100}%`, background: vColors[v.status] ?? "#999" }} />
            ))}
          </div>
          <ul className="space-y-2 text-sm">
            {s.verif.map((v) => (
              <li key={v.status} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: vColors[v.status] ?? "#999" }} />
                <span className="flex-1 font-semibold">{vLabels[v.status] ?? v.status}</span>
                <span className="tabular-nums">{v.n}</span>
                <span className="w-10 text-right text-xs text-muted">{Math.round((v.n / totalV) * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Trajets récemment modifiés</h2>
            <Link href="/admin/trajets" className="text-xs font-bold text-brand-700 hover:underline">
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {s.recentJourneys.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/admin/trajets/${j.id}`} className="font-bold hover:text-brand-700">
                  {j.depName} → {j.arrName} <span className="font-medium text-muted">· {j.companyName}</span>
                </Link>
                <span className="flex items-center gap-3">
                  <StatusBadge status={j.status} />
                  <span className="text-xs text-muted">{fmtDateTime(j.updatedAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <div className="space-y-4">
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Signalements en attente</h2>
              <span className="rounded-full bg-amber-soft px-2 text-xs font-bold text-amber-brand">{s.nReports}</span>
            </div>
            {s.pending.length === 0 ? (
              <p className="text-sm text-muted">Aucun signalement en attente.</p>
            ) : (
              <ul className="space-y-2.5">
                {s.pending.map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="font-bold">{r.issueType ?? (r.kind === "feedback" ? "Avis" : "Signalement")}</p>
                    <p className="line-clamp-1 text-xs text-muted">{r.route ?? r.description}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/signalements" className="mt-3 inline-block text-xs font-bold text-brand-700 hover:underline">
              Traiter les signalements
            </Link>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold">Compagnies mises à jour</h2>
            <ul className="space-y-2 text-sm">
              {s.recentCompanies.map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-muted">{fmtDateTime(c.updatedAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
