import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { PageHeader, Pagination, EmptyState } from "@/components/ui";
import { CitiesManager } from "@/components/AdminCrud";
import { allCities, cityStatsMap } from "@/lib/queries";
import { normalizeText } from "@/lib/utils";

export const dynamic = "force-dynamic";
const PAGE = 12;

export default async function AdminCities({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [cities, stats] = await Promise.all([allCities(), cityStatsMap()]);
  const regions = [...new Set(cities.map((c) => c.region).filter(Boolean))].sort() as string[];
  const rows = cities.filter((c) => (!sp.q || normalizeText(c.name).includes(normalizeText(sp.q))) && (!sp.region || c.region === sp.region));
  const page = Math.max(1, Number(sp.page) || 1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice((page - 1) * PAGE, page * PAGE);
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: String(p) })) if (v) q.set(k, v);
    return `/admin/villes?${q}`;
  };
  return (
    <>
      <PageHeader title="Villes" subtitle={`${cities.length} ville(s). Fusionnez les doublons plutôt que de les supprimer.`} />
      <form className="card mb-4 grid items-end gap-3 p-4 md:grid-cols-[1.5fr_1.2fr_auto]" role="search">
        <div>
          <label htmlFor="q" className="label">Rechercher</label>
          <input id="q" name="q" defaultValue={sp.q} className="field" placeholder="Nom de la ville" />
        </div>
        <div>
          <label htmlFor="region" className="label">Région</label>
          <select id="region" name="region" defaultValue={sp.region ?? ""} className="field">
            <option value="">Toutes</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary">
          <Search size={15} aria-hidden /> Filtrer
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<MapPin />} title="Aucune ville" text="Aucune ville ne correspond au filtre." action={<Link href="/admin/villes" className="btn btn-primary">Réinitialiser</Link>} />
      ) : (
        <CitiesManager
          all={cities.map((c) => ({ id: c.id, name: c.name }))}
          rows={slice.map((c) => ({
            id: c.id,
            name: c.name,
            region: c.region,
            category: c.category,
            description: c.description,
            status: c.status,
            routes: stats.get(c.id)?.routes.size ?? 0,
            companies: stats.get(c.id)?.companies.size ?? 0,
          }))}
        />
      )}
      <Pagination page={page} pages={pages} hrefFor={href} />
    </>
  );
}
