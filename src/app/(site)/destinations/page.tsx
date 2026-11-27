import Link from "next/link";
import type { Metadata } from "next";
import { Search, Waves, Mountain, Sun, Landmark, Trees, Palette, SearchX } from "lucide-react";
import { DestinationCard } from "@/components/DestinationCard";
import { EmptyState, SponsoredSlot } from "@/components/ui";
import { allCities, pairStats } from "@/lib/queries";
import { CATEGORIES, HERO_IMAGE, normalizeText } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Destinations" };

const ICONS: Record<string, typeof Waves> = { plages: Waves, montagnes: Mountain, desert: Sun, historique: Landmark, nature: Trees, culture: Palette };

export default async function DestinationsPage({ searchParams }: { searchParams: Promise<{ q?: string; region?: string; cat?: string }> }) {
  const { q, region, cat } = await searchParams;
  const [cities, stats] = await Promise.all([allCities(), pairStats()]);
  const regions = [...new Set(cities.map((c) => c.region).filter(Boolean))].sort() as string[];
  const filtered = cities.filter(
    (c) =>
      (!q || normalizeText(c.name).includes(normalizeText(q))) &&
      (!region || c.region === region) &&
      (!cat || c.category === cat)
  );
  const isFiltered = !!(q || region || cat);
  const featured = filtered.filter((c) => c.featured);
  const others = filtered.filter((c) => !c.featured);
  const served = new Map<number, number>();
  for (const s of stats.values()) {
    served.set(s.dep, (served.get(s.dep) ?? 0) + s.n);
    served.set(s.arr, (served.get(s.arr) ?? 0) + s.n);
  }
  const catHref = (k?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (region) p.set("region", region);
    if (k) p.set("cat", k);
    const s = p.toString();
    return `/destinations${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-emerald-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cities.find((c) => c.name === "Chefchaouen")?.imageUrl ?? HERO_IMAGE} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/90 to-emerald-950/30" />
        <div className="container-x py-14 sm:py-20">
          <p className="eyebrow !text-[#f0c26a]">Explorer le Maroc</p>
          <h1 className="h-display mt-3 max-w-2xl text-4xl text-white sm:text-5xl lg:text-6xl">Découvrez le Maroc, une ville à la fois.</h1>
          <form action="/destinations" className="mt-8 grid max-w-3xl gap-3 rounded-2xl bg-white p-4 shadow-xl sm:grid-cols-[1.4fr_1fr_auto]" role="search">
            <div>
              <label htmlFor="q" className="label">
                Rechercher une ville
              </label>
              <input id="q" name="q" defaultValue={q} className="field" placeholder="Marrakech, Essaouira…" />
            </div>
            <div>
              <label htmlFor="region" className="label">
                Région
              </label>
              <select id="region" name="region" defaultValue={region ?? ""} className="field">
                <option value="">Toutes les régions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {cat && <input type="hidden" name="cat" value={cat} />}
            <div className="sm:pt-[26px]">
              <button className="btn btn-primary h-11 w-full">
                <Search size={16} aria-hidden /> Explorer
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="container-x py-10">
        <nav aria-label="Catégories de destinations" className="-mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href={catHref()} aria-current={!cat ? "true" : undefined} className={`btn btn-sm shrink-0 ${!cat ? "btn-primary" : "btn-outline"}`}>
            Toutes
          </Link>
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.key];
            return (
              <Link key={c.key} href={catHref(c.key)} aria-current={cat === c.key ? "true" : undefined} className={`btn btn-sm shrink-0 ${cat === c.key ? "btn-primary" : "btn-outline"}`}>
                <Icon size={14} aria-hidden /> {c.label}
              </Link>
            );
          })}
        </nav>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title="Aucune ville ne correspond"
            text="Essayez un autre nom, une autre région ou retirez les filtres."
            action={
              <Link href="/destinations" className="btn btn-primary">
                Réinitialiser
              </Link>
            }
          />
        ) : (
          <>
            {featured.length > 0 && (
              <section aria-labelledby="une">
                <h2 id="une" className="h-display mb-5 text-2xl">
                  {isFiltered ? `${filtered.length} destination${filtered.length > 1 ? "s" : ""}` : "Destinations à la une"}
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {featured.map((c, i) => (
                    <li key={c.id} className="contents">
                      {i === 4 && !isFiltered && <SponsoredSlot variant="card" />}
                      <DestinationCard c={c} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {others.length > 0 && (
              <section className="mt-14" aria-labelledby="pop">
                <h2 id="pop" className="h-display mb-5 text-2xl">
                  {featured.length ? "Autres villes desservies" : "Villes"}
                </h2>
                <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((c) => (
                    <li key={c.id}>
                      <Link href={`/destinations/${c.slug}`} className="card flex items-center justify-between gap-3 p-3.5 hover:border-brand-500">
                        <span>
                          <span className="block text-sm font-extrabold">{c.name}</span>
                          <span className="block text-xs text-muted">{c.region}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-brand-700">{served.get(c.id) ? `${served.get(c.id)} départs` : "Aucun trajet"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
