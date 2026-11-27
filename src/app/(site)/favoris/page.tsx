import Link from "next/link";
import type { Metadata } from "next";
import { Heart, Lock, Route as RouteIcon, MapPin, Building2, RotateCcw, ArrowRight } from "lucide-react";
import { CompanyAvatar, EmptyState, StatusBadge } from "@/components/ui";
import { RemoveFavorite } from "@/components/RemoveFavorite";
import { RecentSearches } from "@/components/RecentSearches";
import { getCurrentUser, getOwnerKey } from "@/lib/auth";
import { recentFor, userFavorites } from "@/lib/queries";
import { HERO_IMAGE } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "routes" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="container-x py-14">
        <EmptyState
          icon={<Lock />}
          title="Connectez-vous pour retrouver vos favoris"
          text="Les favoris sont réservés aux comptes inscrits. La recherche de trajets reste accessible à tous."
          action={
            <>
              <Link href="/connexion?next=/favoris" className="btn btn-primary">
                Se connecter
              </Link>
              <Link href="/inscription" className="btn btn-outline">
                Créer un compte
              </Link>
            </>
          }
        />
      </div>
    );
  }
  const [fav, recent] = await Promise.all([userFavorites(user.id), recentFor(await getOwnerKey(), 6)]);
  const tabs = [
    { k: "routes", label: "Routes", n: fav.journeys.length, icon: RouteIcon },
    { k: "villes", label: "Villes", n: fav.cities.length, icon: MapPin },
    { k: "compagnies", label: "Compagnies", n: fav.companies.length, icon: Building2 },
  ];
  const total = tabs.reduce((a, t) => a + t.n, 0);

  return (
    <div className="container-x py-10">
      <div className="mb-6">
        <p className="eyebrow mb-1.5">Mon espace</p>
        <h1 className="h-display text-3xl">Mes favoris</h1>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="Vous n'avez pas encore de favoris."
          text="Enregistrez des trajets, des villes ou des compagnies pour les retrouver ici."
          action={
            <Link href="/rechercher" className="btn btn-primary">
              Explorer les trajets
            </Link>
          }
        />
      ) : (
        <>
          <div role="tablist" aria-label="Types de favoris" className="mb-6 flex gap-1 border-b border-line">
            {tabs.map((t) => (
              <Link
                key={t.k}
                href={`/favoris?tab=${t.k}`}
                role="tab"
                aria-selected={tab === t.k}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === t.k ? "border-brand-700 text-brand-700" : "border-transparent text-muted hover:text-ink"}`}
              >
                <t.icon size={15} aria-hidden /> {t.label}
                <span className="rounded-full bg-surface px-2 text-xs">{t.n}</span>
              </Link>
            ))}
          </div>

          {tab === "routes" &&
            (fav.journeys.length === 0 ? (
              <EmptyState icon={<RouteIcon />} title="Aucune route enregistrée" action={<Link href="/rechercher" className="btn btn-primary">Explorer les trajets</Link>} />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {fav.journeys.map((j) => (
                  <li key={j.id} className="card p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-2 text-lg font-extrabold">
                          {j.depName} <ArrowRight size={15} className="text-amber-brand rtl-flip" aria-hidden /> {j.arrName}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                          <CompanyAvatar name={j.companyName} size={20} /> {j.companyName}
                        </p>
                      </div>
                      <StatusBadge status={j.status} />
                    </div>
                    <p className="mt-3 text-sm">
                      <span className="font-extrabold tabular-nums">{j.departureTime ?? "Départ non renseigné"}</span>
                      <span className="text-muted"> → </span>
                      <span className="font-extrabold tabular-nums">{j.arrivalTime ?? "Arrivée non renseignée"}</span>
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      <Link href={`/trajets/${j.id}`} className="btn btn-primary btn-sm">
                        Voir le trajet
                      </Link>
                      <Link href={`/rechercher?from=${encodeURIComponent(j.depName)}&to=${encodeURIComponent(j.arrName)}`} className="btn btn-outline btn-sm">
                        <RotateCcw size={13} aria-hidden /> Rechercher à nouveau
                      </Link>
                      <span className="ml-auto">
                        <RemoveFavorite type="journey" id={j.id} label={`le trajet ${j.depName} vers ${j.arrName}`} />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "villes" &&
            (fav.cities.length === 0 ? (
              <EmptyState icon={<MapPin />} title="Aucune ville enregistrée" action={<Link href="/destinations" className="btn btn-primary">Explorer les destinations</Link>} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fav.cities.map((c) => (
                  <li key={c.id} className="card overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageUrl ?? HERO_IMAGE} alt="" className="h-36 w-full object-cover" loading="lazy" />
                    <div className="p-4">
                      <h2 className="text-lg font-extrabold">{c.name}</h2>
                      <p className="text-xs text-muted">{c.region}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Link href={`/destinations/${c.slug}`} className="btn btn-outline btn-sm">
                          Explorer
                        </Link>
                        <Link href={`/rechercher?to=${encodeURIComponent(c.name)}`} className="btn btn-outline btn-sm">
                          Trajets
                        </Link>
                        <span className="ml-auto">
                          <RemoveFavorite type="city" id={c.id} label={c.name} />
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "compagnies" &&
            (fav.companies.length === 0 ? (
              <EmptyState icon={<Building2 />} title="Aucune compagnie enregistrée" action={<Link href="/compagnies" className="btn btn-primary">Voir les compagnies</Link>} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fav.companies.map((c) => (
                  <li key={c.id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <CompanyAvatar name={c.name} size={44} />
                      <div>
                        <h2 className="text-base font-extrabold">{c.name}</h2>
                        <p className="text-xs text-muted">{c.stats?.routes ?? 0} ligne(s) référencée(s)</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Link href={`/compagnies/${c.id}`} className="btn btn-outline btn-sm">
                        Voir la compagnie
                      </Link>
                      <span className="ml-auto">
                        <RemoveFavorite type="company" id={c.id} label={c.name} />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
        </>
      )}

      <div className="mt-14">
        <RecentSearches items={recent} />
      </div>
    </div>
  );
}
