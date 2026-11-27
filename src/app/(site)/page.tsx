import Link from "next/link";
import { ArrowRight, Compass, Layers, MapPinned, Search, Clock, Building2 } from "lucide-react";
import { SearchForm } from "@/components/SearchForm";
import { CompanyAvatar, DemoNotice, SponsoredSlot } from "@/components/ui";
import { RecentSearches } from "@/components/RecentSearches";
import { allCities, listCompanies, popularRoutes, recentFor } from "@/lib/queries";
import { getOwnerKey } from "@/lib/auth";
import { getLang, t } from "@/lib/i18n";
import { HERO_IMAGE, INSPIRATION_IMAGE, fmtDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

const POPULAR: [string, string][] = [
  ["Marrakech", "Casablanca"],
  ["Casablanca", "Rabat"],
  ["Rabat", "Tanger"],
  ["Fès", "Marrakech"],
  ["Agadir", "Marrakech"],
  ["Casablanca", "Agadir"],
];

export default async function HomePage() {
  const lang = await getLang();
  const d = t(lang);
  const [cities, companies, popular, owner] = await Promise.all([allCities(), listCompanies(), popularRoutes(POPULAR), getOwnerKey()]);
  const recent = await recentFor(owner, 4);
  const featured = cities.filter((c) => c.featured);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-emerald-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMAGE} alt="Route sinueuse dans les montagnes de l'Atlas, Maroc" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-950/70 via-emerald-950/40 to-emerald-950/80" />
        <div className="container-x pt-14 pb-12 sm:pt-20 lg:pt-24">
          <p className="eyebrow !text-[#f0c26a]">Autocars interurbains · Maroc</p>
          <h1 className="h-display mt-3 max-w-3xl text-[38px] leading-[1.05] text-white sm:text-5xl lg:text-[64px]">
            {d.heroTitle1}
            <br />
            <span className="text-[#f0c26a]">{d.heroTitle2}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">{d.heroSub}</p>
          <div className="mt-9 lg:mt-12">
            <SearchForm
              variant="hero"
              cities={cities.map((c) => c.name)}
              labels={{ from: d.from, to: d.to, date: d.date, pax: d.pax, swap: d.swap, submit: d.search }}
            />
          </div>
          <div className="mt-5 max-w-3xl">
            <DemoNotice className="bg-white/95" />
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="container-x pt-10">
          <RecentSearches items={recent} />
        </section>
      )}

      {/* TRAJETS POPULAIRES */}
      <section className="container-x pt-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1.5">Trajets populaires</p>
            <h2 className="h-display text-2xl sm:text-3xl">Les liaisons les plus consultées</h2>
          </div>
          <Link href="/rechercher" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
            Tous les trajets <ArrowRight size={15} aria-hidden className="rtl-flip" />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map(({ from, to, stat }) => {
            const dur = fmtDuration(stat?.minDur);
            return (
              <li key={`${from.id}-${to.id}`} className="card group overflow-hidden">
                <div className="relative h-28 overflow-hidden bg-brand-800">
                  {to.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={to.imageUrl} alt="" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent" />
                  <p className="absolute bottom-3 left-4 flex items-center gap-2 text-lg font-extrabold text-white">
                    {from.name} <ArrowRight size={16} aria-hidden className="text-[#f0c26a] rtl-flip" /> {to.name}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="text-[13px] text-muted">
                    {stat ? (
                      <>
                        <p className="flex items-center gap-1.5 font-semibold text-ink">
                          <Clock size={13} aria-hidden /> {dur ? `À partir de ${dur}` : "Durée non renseignée"}
                        </p>
                        <p className="mt-0.5">
                          {stat.n} départ{stat.n > 1 ? "s" : ""} · {stat.companies} compagnie{stat.companies > 1 ? "s" : ""}
                        </p>
                      </>
                    ) : (
                      <p>Horaires non encore renseignés</p>
                    )}
                  </div>
                  <Link
                    href={`/rechercher?from=${encodeURIComponent(from.name)}&to=${encodeURIComponent(to.name)}`}
                    className="btn btn-outline btn-sm shrink-0"
                  >
                    Voir les trajets
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* DESTINATIONS */}
      <section className="container-x pt-20">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1.5">Destinations</p>
            <h2 className="h-display text-2xl sm:text-3xl">Destinations à découvrir</h2>
          </div>
          <Link href="/destinations" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
            Explorer le Maroc <ArrowRight size={15} aria-hidden className="rtl-flip" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          {featured.map((c, i) => (
            <li key={c.id} className={i === 0 ? "lg:row-span-2" : ""}>
              <Link href={`/destinations/${c.slug}`} className="group relative block h-full min-h-[190px] overflow-hidden rounded-xl bg-brand-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imageUrl ?? HERO_IMAGE} alt={`${c.name}, Maroc`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className={`font-extrabold ${i === 0 ? "text-2xl" : "text-lg"}`}>{c.name}</h3>
                  <p className={`mt-1 text-[13px] text-white/85 ${i === 0 ? "" : "hidden sm:line-clamp-2"} line-clamp-2`}>{c.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#f0c26a]">
                    Explorer <ArrowRight size={13} aria-hidden className="rtl-flip" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* COMPAGNIES */}
      <section className="container-x pt-20">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1.5">Compagnies de transport</p>
            <h2 className="h-display text-2xl sm:text-3xl">Les opérateurs référencés</h2>
          </div>
          <Link href="/compagnies" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
            Voir toutes les compagnies <ArrowRight size={15} aria-hidden className="rtl-flip" />
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {companies.slice(0, 4).map((c) => (
            <li key={c.id} className="card flex flex-col p-4">
              <div className="flex items-center gap-3">
                <CompanyAvatar name={c.name} size={44} />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-extrabold">{c.name}</h3>
                  <p className="text-xs text-muted">{c.stats.routes} ligne{c.stats.routes > 1 ? "s" : ""} référencée{c.stats.routes > 1 ? "s" : ""}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[13px] text-muted">
                {c.stats.cities.length ? `Villes : ${c.stats.cities.slice(0, 5).join(", ")}${c.stats.cities.length > 5 ? "…" : ""}` : "Villes desservies non renseignées"}
              </p>
              <Link href={`/compagnies/${c.id}`} className="mt-3 text-sm font-bold text-brand-700 hover:underline">
                Découvrir la compagnie →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* WHY */}
      <section className="mt-20 border-y border-line bg-surface py-16">
        <div className="container-x">
          <div className="mb-9 max-w-2xl">
            <p className="eyebrow mb-1.5">Pourquoi Rihla</p>
            <h2 className="h-display text-2xl sm:text-3xl">Un point de départ clair pour préparer votre voyage</h2>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: "Recherche facile", text: "Choisissez deux villes, une date : les trajets connus s'affichent en quelques secondes." },
              { icon: Layers, title: "Plusieurs trajets", text: "Comparez les horaires de départ et d'arrivée de plusieurs compagnies côte à côte." },
              { icon: Building2, title: "Informations centralisées", text: "Arrêts, durée, contacts et source de chaque donnée, avec son statut de vérification." },
              { icon: Compass, title: "Explorez le Maroc", text: "Des idées de destinations et les moyens de les rejoindre en autocar." },
            ].map((f) => (
              <li key={f.title} className="bg-white p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <f.icon size={22} aria-hidden />
                </span>
                <h3 className="text-base font-extrabold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* INSPIRATION */}
      <section className="container-x pt-20">
        <div className="mb-7">
          <p className="eyebrow mb-1.5">Inspiration voyage</p>
          <h2 className="h-display text-2xl sm:text-3xl">Idées d&apos;escapades à rejoindre en autocar</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <article className="relative min-h-[320px] overflow-hidden rounded-xl bg-brand-900 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={INSPIRATION_IMAGE} alt="Route de montagne dans l'Atlas" className="absolute inset-0 h-full w-full object-cover opacity-70" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 to-transparent" />
            <div className="relative flex h-full min-h-[320px] flex-col justify-end p-6 sm:p-8">
              <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded bg-white/15 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
                <MapPinned size={12} aria-hidden /> Itinéraire
              </span>
              <h3 className="max-w-md text-2xl font-extrabold sm:text-3xl">De Marrakech aux portes du désert</h3>
              <p className="mt-2 max-w-md text-sm text-white/85">
                Franchir l&apos;Atlas vers Ouarzazate, route des kasbahs et des décors de cinéma.
              </p>
              <Link href="/destinations/ouarzazate" className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[#f0c26a]">
                Lire la suite <ArrowRight size={14} aria-hidden className="rtl-flip" />
              </Link>
            </div>
          </article>
          <div className="grid gap-4">
            {featured
              .filter((c) => ["Essaouira", "Chefchaouen"].includes(c.name))
              .map((c) => (
                <Link key={c.id} href={`/destinations/${c.slug}`} className="card group flex overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl ?? HERO_IMAGE} alt="" className="h-full w-32 object-cover sm:w-44" loading="lazy" />
                  <div className="flex flex-col justify-center p-4">
                    <p className="eyebrow mb-1">{c.category === "plages" ? "Océan" : "Montagne"}</p>
                    <h3 className="text-lg font-extrabold group-hover:text-brand-700">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 text-[13px] text-muted">{c.description}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
        <div className="mt-6">
          <SponsoredSlot />
        </div>
      </section>
    </>
  );
}
