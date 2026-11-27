import Link from "next/link";
import type { Metadata } from "next";
import { Building2, LayoutGrid, List, Search, ArrowRight } from "lucide-react";
import { CompanyAvatar, EmptyState, Pagination, StatusBadge } from "@/components/ui";
import { listCompanies } from "@/lib/queries";
import { normalizeText } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compagnies de transport" };
const PAGE = 9;

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const all = await listCompanies();
  const cityList = [...new Set(all.flatMap((c) => c.stats.cities))].sort((a, b) => a.localeCompare(b));
  let rows = all.filter(
    (c) => (!sp.q || normalizeText(c.name).includes(normalizeText(sp.q))) && (!sp.city || c.stats.cities.includes(sp.city))
  );
  if (sp.sort === "za") rows = [...rows].sort((a, b) => b.name.localeCompare(a.name));
  else if (sp.sort === "routes") rows = [...rows].sort((a, b) => b.stats.routes - a.stats.routes);
  const view = sp.view === "list" ? "list" : "grid";
  const page = Math.max(1, Number(sp.page) || 1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice((page - 1) * PAGE, page * PAGE);
  const href = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, String(v));
    return `/compagnies?${p}`;
  };

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1.5">Annuaire</p>
        <h1 className="h-display text-3xl sm:text-4xl">Compagnies de transport</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">Découvrez les opérateurs et les destinations qu&apos;ils desservent.</p>
      </div>

      <form action="/compagnies" role="search" className="card mb-6 grid items-end gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
        <div>
          <label htmlFor="q" className="label">
            Rechercher une compagnie
          </label>
          <input id="q" name="q" defaultValue={sp.q} className="field" placeholder="Nom de la compagnie" />
        </div>
        <div>
          <label htmlFor="city" className="label">
            Ville desservie
          </label>
          <select id="city" name="city" defaultValue={sp.city ?? ""} className="field">
            <option value="">Toutes les villes</option>
            {cityList.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">
            Trier
          </label>
          <select id="sort" name="sort" defaultValue={sp.sort ?? "az"} className="field">
            <option value="az">Alphabétique (A → Z)</option>
            <option value="za">Alphabétique (Z → A)</option>
            <option value="routes">Nombre de lignes</option>
          </select>
        </div>
        <input type="hidden" name="view" value={view} />
        <button className="btn btn-primary">
          <Search size={15} aria-hidden /> Filtrer
        </button>
        <div className="flex gap-1" role="group" aria-label="Affichage">
          <Link href={href({ view: "grid", page: 1 })} aria-label="Vue grille" aria-pressed={view === "grid"} className={`btn !px-3 ${view === "grid" ? "btn-primary" : "btn-outline"}`}>
            <LayoutGrid size={16} aria-hidden />
          </Link>
          <Link href={href({ view: "list", page: 1 })} aria-label="Vue liste" aria-pressed={view === "list"} className={`btn !px-3 ${view === "list" ? "btn-primary" : "btn-outline"}`}>
            <List size={16} aria-hidden />
          </Link>
        </div>
      </form>

      <p className="mb-4 text-sm font-semibold text-muted" aria-live="polite">
        {rows.length} compagnie{rows.length > 1 ? "s" : ""}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="Aucune compagnie trouvée"
          text="Modifiez votre recherche ou retirez le filtre de ville."
          action={
            <Link href="/compagnies" className="btn btn-primary">
              Voir toutes les compagnies
            </Link>
          }
        />
      ) : (
        <ul className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {slice.map((c) => (
            <li key={c.id} className={`card p-5 ${view === "list" ? "flex flex-col gap-4 md:flex-row md:items-center" : "flex flex-col"}`}>
              <div className="flex flex-1 items-start gap-4">
                <CompanyAvatar name={c.name} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold">{c.name}</h2>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted">{c.description ?? "Description non renseignée."}</p>
                  <p className="mt-2 text-xs font-semibold text-muted">
                    {c.stats.routes > 0 ? `${c.stats.routes} ligne${c.stats.routes > 1 ? "s" : ""} référencée${c.stats.routes > 1 ? "s" : ""}` : "Lignes non renseignées"}
                    {c.stats.cities.length > 0 && ` · ${c.stats.cities.length} villes`}
                  </p>
                  {c.stats.cities.length > 0 && <p className="mt-1 line-clamp-1 text-xs text-muted">{c.stats.cities.slice(0, 6).join(" · ")}</p>}
                </div>
              </div>
              <Link href={`/compagnies/${c.id}`} className="btn btn-outline btn-sm mt-4 md:mt-0">
                Voir la compagnie <ArrowRight size={14} aria-hidden className="rtl-flip" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pages={pages} hrefFor={(p) => href({ page: p })} />
    </div>
  );
}
