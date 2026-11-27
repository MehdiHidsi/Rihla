import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Bus, Clock, Sparkles, MapPin } from "lucide-react";
import { Breadcrumb, EmptyState, SponsoredSlot } from "@/components/ui";
import { FavoriteButton } from "@/components/FavoriteButton";
import { DestinationCard } from "@/components/DestinationCard";
import { SearchForm } from "@/components/SearchForm";
import { allCities, cityBySlug, cityPairs, companiesForCity, favoriteSet } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, HERO_IMAGE, fmtDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await cityBySlug((await params).slug);
  return { title: c ? `${c.name} — Destination` : "Destination" };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await cityBySlug(slug);
  if (!city) notFound();
  const [all, pairs, cos, user] = await Promise.all([allCities(), cityPairs(city.id), companiesForCity(city.id), getCurrentUser()]);
  const favs = user ? await favoriteSet(user.id) : new Set<string>();
  const highlights = (city.highlights ?? "").split("|").filter(Boolean);
  const arrivals = pairs.filter((p) => p.arrId === city.id);
  const departures = pairs.filter((p) => p.depId === city.id);
  const similar = all.filter((c) => c.featured && c.id !== city.id).slice(0, 4);
  const cat = CATEGORIES.find((c) => c.key === city.category)?.label;
  const names = all.map((c) => c.name);

  const PairList = ({ items, dir }: { items: typeof pairs; dir: "in" | "out" }) => (
    <ul className="divide-y divide-line">
      {items.map((p) => {
        const other = dir === "in" ? p.depName : p.arrName;
        const dur = fmtDuration(p.minDur);
        return (
          <li key={`${p.depId}-${p.arrId}`}>
            <Link
              href={`/rechercher?from=${encodeURIComponent(p.depName)}&to=${encodeURIComponent(p.arrName)}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-brand-700"
            >
              <span className="text-sm font-extrabold">
                {dir === "in" ? `${other} → ${city.name}` : `${city.name} → ${other}`}
              </span>
              <span className="flex items-center gap-3 text-xs text-muted">
                {dur && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} aria-hidden /> dès {dur}
                  </span>
                )}
                <span>{p.n} départ{p.n > 1 ? "s" : ""}</span>
                <span className="hidden sm:inline">{p.companies}</span>
                <ArrowRight size={14} aria-hidden className="rtl-flip" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <section className="relative isolate overflow-hidden bg-emerald-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={city.imageUrl ?? HERO_IMAGE} alt={`${city.name}, Maroc`} className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-950/90 via-emerald-950/30 to-emerald-950/30" />
        <div className="container-x flex min-h-[340px] flex-col justify-end pt-10 pb-10 text-white sm:min-h-[420px]">
          <div className="[&_nav]:text-white/80 [&_a]:text-white/80 [&_span]:text-white">
            <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Destinations", href: "/destinations" }, { label: city.name }]} />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/85">
                <MapPin size={14} aria-hidden /> {city.region}, {city.country} {cat && <span className="rounded bg-white/20 px-2 py-0.5 text-xs">{cat}</span>}
              </p>
              <h1 className="h-display text-5xl sm:text-6xl">{city.name}</h1>
              <p className="mt-3 max-w-xl text-base text-white/90">{city.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/rechercher?to=${encodeURIComponent(city.name)}`} className="btn btn-amber">
                <Bus size={16} aria-hidden /> Trajets vers {city.name}
              </Link>
              <FavoriteButton type="city" id={city.id} initial={favs.has(`city:${city.id}`)} variant="pill" label="Ajouter la ville" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          {highlights.length > 0 && (
            <section aria-labelledby="insp">
              <p className="eyebrow mb-1.5">Inspiration voyage</p>
              <h2 id="insp" className="h-display mb-4 text-2xl">
                À voir et à faire à {city.name}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {highlights.map((h, i) => (
                  <li key={h} className="card flex items-start gap-3 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-extrabold text-brand-700">{i + 1}</span>
                    <span className="pt-1 text-sm font-semibold">{h}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="comment">
            <p className="eyebrow mb-1.5">Y aller</p>
            <h2 id="comment" className="h-display mb-4 text-2xl">
              Comment rejoindre cette ville en autocar ?
            </h2>
            {pairs.length === 0 ? (
              <EmptyState
                icon={<Bus />}
                title="Aucun trajet référencé pour le moment"
                text={`Nous n'avons pas encore de liaison en autocar vers ou depuis ${city.name} dans notre base.`}
                action={
                  <Link href="/aide#signaler" className="btn btn-primary">
                    Suggérer un trajet
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {arrivals.length > 0 && (
                  <div className="card p-5">
                    <h3 className="mb-1 text-sm font-extrabold">Arriver à {city.name}</h3>
                    <PairList items={arrivals} dir="in" />
                  </div>
                )}
                {departures.length > 0 && (
                  <div className="card p-5">
                    <h3 className="mb-1 text-sm font-extrabold">Partir de {city.name}</h3>
                    <PairList items={departures} dir="out" />
                  </div>
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="pop">
            <h2 id="pop" className="h-display mb-4 text-2xl">
              Destinations populaires
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {similar.slice(0, 2).map((c) => (
                <li key={c.id}>
                  <DestinationCard c={c} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold">
              <Sparkles size={16} aria-hidden /> Rechercher vers {city.name}
            </h2>
            <SearchForm cities={names} initial={{ to: city.name }} />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 text-base font-extrabold">Compagnies desservant {city.name}</h2>
            {cos.length === 0 ? (
              <p className="text-sm text-muted">Aucune compagnie référencée pour cette ville.</p>
            ) : (
              <ul className="space-y-1.5">
                {cos.map((c) => (
                  <li key={c.id}>
                    <Link href={`/compagnies/${c.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-bold hover:bg-surface">
                      {c.name} <ArrowRight size={14} aria-hidden className="rtl-flip" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <SponsoredSlot variant="card" />
        </aside>
      </div>
    </>
  );
}
