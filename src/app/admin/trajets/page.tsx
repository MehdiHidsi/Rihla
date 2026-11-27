import Link from "next/link";
import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Bus, Search } from "lucide-react";
import { PageHeader, Pagination, EmptyState } from "@/components/ui";
import { JourneysTable } from "@/components/AdminJourneys";
import { allCities, arrCity, countJourneys, depCity, listCompanies, queryJourneys } from "@/lib/queries";
import { companies, journeys } from "@/db/schema";
import { toRow } from "@/lib/admin-rows";

export const dynamic = "force-dynamic";
const PAGE = 15;

export default async function AdminJourneysPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [cos, cities] = await Promise.all([listCompanies(), allCities()]);
  const conds: SQL[] = [];
  if (sp.q) {
    const like = `%${sp.q}%`;
    conds.push(or(ilike(companies.name, like), ilike(depCity.name, like), ilike(arrCity.name, like))!);
  }
  if (sp.company) conds.push(eq(journeys.companyId, Number(sp.company)));
  if (sp.status) conds.push(eq(journeys.verificationStatus, sp.status));
  if (sp.dep) conds.push(eq(journeys.departureCityId, Number(sp.dep)));
  const where = conds.length ? and(...conds) : undefined;
  const sortMap = {
    departure: journeys.departureTime,
    company: companies.name,
    route: depCity.name,
    status: journeys.verificationStatus,
    updated: journeys.updatedAt,
  } as const;
  const key = (sp.sort && sp.sort in sortMap ? sp.sort : "route") as keyof typeof sortMap;
  const dir = sp.dir === "desc" ? desc : asc;
  const page = Math.max(1, Number(sp.page) || 1);
  const [total, rows] = await Promise.all([
    countJourneys(where),
    queryJourneys({ where, order: [dir(sortMap[key]), asc(journeys.departureTime)], limit: PAGE, offset: (page - 1) * PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: String(p) })) if (v) q.set(k, v);
    return `/admin/trajets?${q}`;
  };
  return (
    <>
      <PageHeader title="Trajets" subtitle={`${total} trajet(s) correspondant aux critères.`} />
      <form className="card mb-4 grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]" role="search">
        <div>
          <label htmlFor="q" className="label">Rechercher</label>
          <input id="q" name="q" defaultValue={sp.q} className="field" placeholder="Compagnie ou ville" />
        </div>
        <div>
          <label htmlFor="company" className="label">Compagnie</label>
          <select id="company" name="company" defaultValue={sp.company ?? ""} className="field">
            <option value="">Toutes</option>
            {cos.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dep" className="label">Départ</label>
          <select id="dep" name="dep" defaultValue={sp.dep ?? ""} className="field">
            <option value="">Toutes</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label">Statut</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="field">
            <option value="">Tous</option>
            <option value="verified">Vérifié</option>
            <option value="unverified">Non vérifié</option>
            <option value="needs_review">À vérifier</option>
            <option value="rejected">Rejeté</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">Trier par</label>
          <div className="flex gap-1.5">
            <select id="sort" name="sort" defaultValue={key} className="field">
              <option value="route">Ville de départ</option>
              <option value="departure">Heure de départ</option>
              <option value="company">Compagnie</option>
              <option value="status">Statut</option>
              <option value="updated">Mise à jour</option>
            </select>
            <select name="dir" aria-label="Ordre" defaultValue={sp.dir ?? "asc"} className="field !w-20">
              <option value="asc">↑</option>
              <option value="desc">↓</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary">
          <Search size={15} aria-hidden /> Filtrer
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<Bus />} title="Aucun trajet" text="Aucun trajet ne correspond à ces critères." action={<><Link href="/admin/trajets" className="btn btn-outline">Réinitialiser</Link><Link href="/admin/trajets/nouveau" className="btn btn-primary">Ajouter un trajet</Link></>} />
      ) : (
        <JourneysTable rows={rows.map((r) => toRow(r))} />
      )}
      <Pagination page={page} pages={pages} hrefFor={href} />
    </>
  );
}
