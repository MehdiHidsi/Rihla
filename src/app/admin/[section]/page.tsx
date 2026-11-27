import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { Flag, Inbox } from "lucide-react";
import { db } from "@/db";
import { cities, companies, journeys, reports, routeStops, routes, schedules } from "@/db/schema";
import { depCity, arrCity, queryJourneys } from "@/lib/queries";
import { ensureSeed } from "@/lib/seed";
import { EmptyState, PageHeader } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { fmtDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Table({ heads, rows }: { heads: string[]; rows: (string | number | null)[][] }) {
  return (
    <>
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs tracking-wide text-muted uppercase">
            <tr>
              {heads.map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-sand/60">
                {r.map((c, j) => (
                  <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-bold" : "text-muted"}`}>
                    {c ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2.5 md:hidden">
        {rows.map((r, i) => (
          <li key={i} className="card p-4 text-sm">
            <p className="font-extrabold">{r[0]}</p>
            <dl className="mt-1 grid grid-cols-[110px_1fr] gap-y-0.5 text-xs">
              {heads.slice(1).map((h, k) => (
                <div key={h} className="contents">
                  <dt className="text-muted">{h}</dt>
                  <dd className="font-semibold">{r[k + 1] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  await ensureSeed();

  if (section === "routes") {
    const rows = await db
      .select({ id: routes.id, company: companies.name, dep: depCity.name, arr: arrCity.name })
      .from(routes)
      .innerJoin(companies, eq(companies.id, routes.companyId))
      .innerJoin(depCity, eq(depCity.id, routes.departureCityId))
      .innerJoin(arrCity, eq(arrCity.id, routes.arrivalCityId))
      .orderBy(asc(depCity.name), asc(arrCity.name))
      .limit(120);
    const stops = await db.select({ routeId: routeStops.routeId }).from(routeStops);
    const sc = new Map<number, number>();
    stops.forEach((s) => sc.set(s.routeId, (sc.get(s.routeId) ?? 0) + 1));
    return (
      <>
        <PageHeader title="Lignes" subtitle="Une ligne relie deux villes pour une compagnie. Les trajets (horaires) s'y rattachent." />
        <Table heads={["Ligne", "Compagnie", "Arrêts intermédiaires", "Réf."]} rows={rows.map((r) => [`${r.dep} → ${r.arr}`, r.company, sc.get(r.id) ?? 0, `#${r.id}`])} />
      </>
    );
  }

  if (section === "arrets") {
    const rows = await db
      .select({ routeId: routeStops.routeId, order: routeStops.stopOrder, city: cities.name, company: companies.name, dep: depCity.name, arr: arrCity.name })
      .from(routeStops)
      .innerJoin(cities, eq(cities.id, routeStops.stopCityId))
      .innerJoin(routes, eq(routes.id, routeStops.routeId))
      .innerJoin(companies, eq(companies.id, routes.companyId))
      .innerJoin(depCity, eq(depCity.id, routes.departureCityId))
      .innerJoin(arrCity, eq(arrCity.id, routes.arrivalCityId))
      .orderBy(asc(routeStops.routeId), asc(routeStops.stopOrder))
      .limit(150);
    return (
      <>
        <PageHeader title="Arrêts" subtitle="Arrêts intermédiaires des lignes, dans l'ordre de passage." />
        <Table heads={["Arrêt", "Ordre", "Ligne", "Compagnie"]} rows={rows.map((r) => [r.city, r.order, `${r.dep} → ${r.arr}`, r.company])} />
      </>
    );
  }

  if (section === "horaires") {
    const rows = await db.select().from(schedules).orderBy(asc(schedules.journeyId)).limit(120);
    const js = await queryJourneys({ order: [asc(journeys.id)] });
    const by = new Map(js.map((j) => [j.id, j]));
    const withSched = new Set(rows.map((r) => r.journeyId));
    const missing = js.filter((j) => !withSched.has(j.id)).length;
    return (
      <>
        <PageHeader title="Horaires" subtitle={`${missing} trajet(s) sans jours de circulation renseignés.`} />
        {rows.length === 0 ? (
          <EmptyState icon={<Inbox />} title="Aucun horaire détaillé" text="Ajoutez les jours de circulation depuis l'éditeur de trajet." action={<Link href="/admin/trajets" className="btn btn-primary">Ouvrir les trajets</Link>} />
        ) : (
          <Table
            heads={["Trajet", "Compagnie", "Jours de circulation", "Détails"]}
            rows={rows.map((r) => {
              const j = by.get(r.journeyId);
              return [j ? `${j.depName} → ${j.arrName} · ${j.departureTime ?? "?"}` : `#${r.journeyId}`, j?.companyName ?? "—", r.operatingDays, r.scheduleDetails];
            })}
          />
        )}
      </>
    );
  }

  if (section === "signalements") {
    const rows = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(60);
    return (
      <>
        <PageHeader title="Signalements" subtitle="Corrections proposées par les utilisateurs et avis reçus." />
        {rows.length === 0 ? (
          <EmptyState icon={<Flag />} title="Aucun signalement" text="Les signalements envoyés depuis le centre d'aide apparaîtront ici." />
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold">
                      {r.kind === "feedback" ? "Avis" : (r.issueType ?? "Signalement")}
                      {r.route && <span className="font-medium text-muted"> · {r.route}</span>}
                      {r.companyName && <span className="font-medium text-muted"> · {r.companyName}</span>}
                    </p>
                    <p className="mt-1 text-sm text-muted">{r.description}</p>
                    <p className="mt-1.5 text-xs text-muted">
                      {fmtDateTime(r.createdAt)} {r.email && `· ${r.email}`} {r.journeyId && <Link href={`/admin/trajets/${r.journeyId}`} className="font-bold text-brand-700 underline">Voir le trajet</Link>}
                    </p>
                  </div>
                  {r.status === "pending" ? <ReportActions id={r.id} /> : <span className="rounded bg-surface px-2 py-1 text-xs font-bold text-muted">{r.status === "resolved" ? "Traité" : "Ignoré"}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  if (section === "parametres") {
    return (
      <>
        <PageHeader title="Paramètres" subtitle="Règles de gestion des données et de la publicité." />
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { t: "Règles de vérification", items: ["« Vérifié » exige une heure de départ et une source.", "Les imports arrivent toujours « Non vérifiés » ou « À vérifier ».", "Les prix ne sont affichés que s'ils sont renseignés — jamais « 0 DH »."] },
            { t: "Publicité", items: ["Emplacements clairement étiquetés « Publicité » / « Sponsorisé ».", "Aucune publicité dans le formulaire de recherche.", "Jamais mélangée aux résultats organiques ; pas de pop-up."] },
            { t: "Langues", items: ["Français (par défaut) et arabe (lecture de droite à gauche).", "Le choix est mémorisé dans le profil de l'utilisateur."] },
            { t: "Évolutions prévues", items: ["Réservation de billets et paiements.", "Partenariats avec les opérateurs.", "Suivi en temps réel et carte OpenStreetMap."] },
          ].map((b) => (
            <section key={b.t} className="card p-5">
              <h2 className="mb-2 text-base font-extrabold">{b.t}</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {b.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </>
    );
  }

  notFound();
}
