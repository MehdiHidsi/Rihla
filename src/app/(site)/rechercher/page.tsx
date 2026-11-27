import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, SearchX, Route as RouteIcon, TriangleAlert, Pencil } from "lucide-react";
import { SearchForm } from "@/components/SearchForm";
import { JourneyCard } from "@/components/JourneyCard";
import { Filters, SortSelect } from "@/components/Filters";
import { DemoNotice, EmptyState, SponsoredSlot } from "@/components/ui";
import { RecentSearches } from "@/components/RecentSearches";
import {
  allCities,
  favoriteSet,
  findCityByName,
  hasPrices,
  otherDestinationsFrom,
  pairStats,
  recentFor,
  searchJourneys,
} from "@/lib/queries";
import { getCurrentUser, getOwnerKey } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rechercher un trajet" };

type SP = Record<string, string | undefined>;

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [cities, user, owner] = await Promise.all([allCities(), getCurrentUser(), getOwnerKey()]);
  const names = cities.map((c) => c.name);
  const pax = Math.min(Math.max(Number(sp.pax) || 1, 1), 9);
  const initial = { from: sp.from, to: sp.to, date: sp.date, pax };
  const form = (
    <section id="modifier" aria-label="Modifier la recherche" className="border-b border-line bg-surface">
      <div className="container-x py-6">
        <h1 className="mb-3 text-xl font-extrabold sm:text-2xl">Rechercher un trajet en autocar</h1>
        <SearchForm cities={names} initial={initial} />
      </div>
    </section>
  );

  // --- recherche vide ---
  if (!sp.from && !sp.to) {
    const [recent, stats] = await Promise.all([recentFor(owner, 6), pairStats()]);
    const byId = new Map(cities.map((c) => [c.id, c]));
    const top = [...stats.values()].sort((a, b) => b.n - a.n).slice(0, 6);
    return (
      <>
        {form}
        <div className="container-x space-y-10 py-10">
          <EmptyState
            icon={<RouteIcon />}
            title="Où souhaitez-vous aller ?"
            text="Indiquez une ville de départ et une destination pour afficher les trajets référencés."
          />
          {recent.length > 0 && <RecentSearches items={recent} />}
          <section>
            <h2 className="mb-3 text-base font-extrabold">Liaisons référencées</h2>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {top.map((s) => {
                const a = byId.get(s.dep)!;
                const b = byId.get(s.arr)!;
                return (
                  <li key={`${s.dep}-${s.arr}`}>
                    <Link href={`/rechercher?from=${encodeURIComponent(a.name)}&to=${encodeURIComponent(b.name)}`} className="card flex items-center justify-between p-3.5 hover:border-brand-500">
                      <span className="text-sm font-extrabold">
                        {a.name} → {b.name}
                      </span>
                      <span className="text-xs text-muted">{s.n} départs</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </>
    );
  }

  const [fromCity, toCity] = await Promise.all([findCityByName(sp.from), findCityByName(sp.to)]);
  if (!fromCity || !toCity || fromCity.id === toCity.id) {
    return (
      <>
        {form}
        <div className="container-x py-10">
          <EmptyState
            tone="warn"
            icon={<TriangleAlert />}
            title="Recherche incomplète"
            text={
              !fromCity && sp.from
                ? `La ville « ${sp.from} » n'est pas reconnue. Sélectionnez une ville dans la liste proposée.`
                : !toCity && sp.to
                  ? `La ville « ${sp.to} » n'est pas reconnue. Sélectionnez une ville dans la liste proposée.`
                  : "Choisissez deux villes différentes pour lancer la recherche."
            }
            action={
              <a href="#modifier" className="btn btn-primary">
                Modifier la recherche
              </a>
            }
          />
        </div>
      </>
    );
  }

  const filters = {
    companies: (sp.co ?? "").split(",").map(Number).filter(Boolean),
    slots: (sp.slot ?? "").split(",").filter(Boolean),
    maxDuration: sp.dur ? Number(sp.dur) : undefined,
    directOnly: sp.direct === "1",
    sort: sp.sort,
  };
  const [base, results, prices, favs, alt] = await Promise.all([
    searchJourneys(fromCity.id, toCity.id),
    searchJourneys(fromCity.id, toCity.id, filters),
    hasPrices(),
    user ? favoriteSet(user.id) : Promise.resolve(new Set<string>()),
    otherDestinationsFrom(fromCity.id),
  ]);
  const facet = new Map<number, { id: number; name: string; n: number }>();
  for (const j of base) {
    const e = facet.get(j.companyId) ?? { id: j.companyId, name: j.companyName, n: 0 };
    e.n++;
    facet.set(j.companyId, e);
  }
  const companiesFacet = [...facet.values()].sort((a, b) => a.name.localeCompare(b.name));
  const filtersActive = base.length !== results.length;

  return (
    <>
      {form}
      <div className="container-x py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted" aria-live="polite">
              {results.length} trajet{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
              {filtersActive && ` sur ${base.length}`}
            </p>
            <h2 className="h-display mt-1 flex flex-wrap items-center gap-2 text-2xl sm:text-3xl">
              {fromCity.name} <ArrowRight className="text-amber-brand rtl-flip" aria-hidden /> {toCity.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {sp.date ? fmtDate(sp.date) : "Date flexible — horaires récurrents"} · {pax} passager{pax > 1 ? "s" : ""}
            </p>
          </div>
          <a href="#modifier" className="btn btn-outline">
            <Pencil size={15} aria-hidden /> Modifier la recherche
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div>
            <Filters companies={companiesFacet} hasPrices={prices} />
          </div>
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <DemoNotice className="flex-1" />
              <SortSelect hasPrices={prices} />
            </div>

            {base.length === 0 ? (
              <EmptyState
                icon={<SearchX />}
                title="Aucun trajet référencé pour cette liaison"
                text={`Nous n'avons pas encore de départ de ${fromCity.name} vers ${toCity.name}. Il peut exister des trajets non encore ajoutés.`}
                action={
                  <>
                    {alt.slice(0, 3).map((a) => (
                      <Link key={a.id} href={`/rechercher?from=${encodeURIComponent(fromCity.name)}&to=${encodeURIComponent(a.name)}`} className="btn btn-outline">
                        {fromCity.name} → {a.name}
                      </Link>
                    ))}
                    <Link href="/aide#signaler" className="btn btn-primary">
                      Signaler un trajet manquant
                    </Link>
                  </>
                }
              />
            ) : results.length === 0 ? (
              <EmptyState
                icon={<SearchX />}
                title="Aucun résultat avec ces filtres"
                text="Élargissez vos critères pour afficher plus de trajets."
                action={
                  <Link href={`/rechercher?from=${encodeURIComponent(fromCity.name)}&to=${encodeURIComponent(toCity.name)}${sp.date ? `&date=${sp.date}` : ""}&pax=${pax}`} className="btn btn-primary">
                    Réinitialiser les filtres
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {results.map((j) => (
                  <li key={j.id}>
                    <JourneyCard j={j} fav={favs.has(`journey:${j.id}`)} date={sp.date} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8">
              <SponsoredSlot />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
