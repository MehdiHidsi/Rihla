import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Clock,
  Flag,
  Globe,
  Info,
  Phone,
  TriangleAlert,
  Wallet,
  ExternalLink,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";
import { Breadcrumb, CompanyAvatar, StatusBadge } from "@/components/ui";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { RouteMap } from "@/components/RouteMap";
import { allCities, companyById, companyPairs, favoriteSet, getJourney, getSchedule, queryJourneys, routeStopsFull } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { and, asc, eq, ne } from "drizzle-orm";
import { journeys } from "@/db/schema";
import { fmtDate, fmtDateTime, fmtDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const j = Number(id) ? await getJourney(Number(id)) : null;
  return { title: j ? `${j.depName} → ${j.arrName} · ${j.companyName}` : "Détails du trajet" };
}

export default async function JourneyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;
  const jid = Number(id);
  if (!jid) notFound();
  const j = await getJourney(jid);
  if (!j) notFound();
  const [user, company, schedule, stops, cities, pairs, same] = await Promise.all([
    getCurrentUser(),
    companyById(j.companyId),
    getSchedule(j.id),
    j.routeId ? routeStopsFull(j.routeId) : Promise.resolve([]),
    allCities(),
    companyPairs(j.companyId),
    queryJourneys({
      where: and(eq(journeys.departureCityId, j.depId), eq(journeys.arrivalCityId, j.arrId), ne(journeys.id, j.id)),
      order: [asc(journeys.departureTime)],
      limit: 6,
    }),
  ]);
  const favs = user ? await favoriteSet(user.id) : new Set<string>();
  const cityMap = new Map(cities.map((c) => [c.name, c]));
  const dur = fmtDuration(j.duration);
  const backHref = `/rechercher?from=${encodeURIComponent(j.depName)}&to=${encodeURIComponent(j.arrName)}${date ? `&date=${date}` : ""}`;
  const points = [j.depName, ...stops.map((s) => s.name), j.arrName].map((n) => ({
    name: n,
    lat: cityMap.get(n)?.lat ?? null,
    lng: cityMap.get(n)?.lng ?? null,
  }));
  const tiles = [
    { icon: Clock, label: "Départ", value: j.departureTime ?? "Non renseigné", muted: !j.departureTime, sub: j.depName },
    { icon: Flag, label: "Arrivée", value: j.arrivalTime ?? "Non renseignée", muted: !j.arrivalTime, sub: j.arrName },
    { icon: Clock, label: "Durée", value: dur ?? "Non renseignée", muted: !dur, sub: "Estimation indicative" },
    { icon: Wallet, label: "Prix", value: j.price ? `${Number(j.price)} DH` : "Prix non renseigné", muted: !j.price, sub: j.price ? "Tarif communiqué" : "Aucun tarif vérifié" },
  ];

  return (
    <div className="container-x py-8">
      <Breadcrumb
        items={[{ label: "Accueil", href: "/" }, { label: "Recherche", href: backHref }, { label: "Détails du trajet" }]}
      />

      <header className="card mb-6 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={j.status} />
              <span className="text-xs font-semibold text-muted">Trajet n° {j.id}</span>
            </div>
            <h1 className="h-display flex flex-wrap items-center gap-x-3 text-3xl sm:text-4xl">
              {j.depName} <ArrowRight className="text-amber-brand rtl-flip" aria-hidden /> {j.arrName}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} aria-hidden /> {date ? fmtDate(date) : "Date non précisée — horaire récurrent"}
              </span>
              <Link href={`/compagnies/${j.companyId}`} className="inline-flex items-center gap-2 font-bold text-ink hover:text-brand-700">
                <CompanyAvatar name={j.companyName} size={22} /> {j.companyName}
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FavoriteButton type="journey" id={j.id} initial={favs.has(`journey:${j.id}`)} variant="pill" label="Enregistrer le trajet" />
            <ShareButton title={`${j.depName} → ${j.arrName} (${j.companyName})`} />
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg border border-line bg-sand p-4">
              <dt className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted uppercase">
                <t.icon size={13} aria-hidden /> {t.label}
              </dt>
              <dd className={`mt-1.5 font-extrabold tabular-nums ${t.muted ? "text-sm text-warn" : "text-2xl"}`}>{t.value}</dd>
              <p className="mt-0.5 text-xs text-muted">{t.sub}</p>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Timeline */}
          <section className="card p-5 sm:p-7" aria-labelledby="timeline">
            <h2 id="timeline" className="mb-5 text-lg font-extrabold">
              Itinéraire et arrêts
            </h2>
            <ol className="relative">
              {[
                { name: j.depName, time: j.departureTime, kind: "start" as const, empty: "Heure non renseignée" },
                ...stops.map((s) => ({ name: s.name, time: null as string | null, kind: "stop" as const, empty: "Heure non renseignée" })),
                { name: j.arrName, time: j.arrivalTime, kind: "end" as const, empty: "Arrivée non renseignée" },
              ].map((s, i, arr) => (
                <li key={`${s.name}-${i}`} className="relative flex gap-4 pb-7 last:pb-0">
                  {i < arr.length - 1 && <span className="absolute top-5 bottom-[-4px] left-[8px] w-0.5 bg-brand-200" aria-hidden />}
                  <span
                    aria-hidden
                    className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-[3px] ${
                      s.kind === "start" ? "border-brand-700 bg-brand-700" : s.kind === "end" ? "border-amber-brand bg-amber-brand" : "border-brand-700 bg-white"
                    }`}
                  />
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4">
                    <div>
                      <p className={`font-extrabold ${s.kind === "stop" ? "text-[15px]" : "text-lg"}`}>{s.name}</p>
                      <p className="text-xs font-semibold text-muted">
                        {s.kind === "start" ? "Ville de départ" : s.kind === "end" ? "Ville d'arrivée" : "Arrêt intermédiaire"}
                      </p>
                    </div>
                    {s.time ? (
                      <p className="text-xl font-extrabold tabular-nums">{s.time}</p>
                    ) : (
                      <p className="text-xs font-semibold text-warn">{s.empty}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {stops.length === 0 && (
              <p className="mt-4 rounded-lg bg-surface p-3 text-sm text-muted">
                {j.routeId ? "Trajet direct, sans arrêt intermédiaire référencé." : "Arrêts intermédiaires non renseignés pour ce trajet."}
              </p>
            )}
          </section>

          <section className="card p-5 sm:p-7" aria-labelledby="carte">
            <h2 id="carte" className="mb-4 text-lg font-extrabold">
              Parcours
            </h2>
            <RouteMap points={points} />
          </section>

          <section className="card p-5 sm:p-7" aria-labelledby="infos">
            <h2 id="infos" className="mb-4 text-lg font-extrabold">
              Informations pratiques
            </h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold">Jours de circulation</dt>
                <dd className="mt-0.5 text-muted">{schedule?.operatingDays ?? "Jours de circulation non renseignés"}</dd>
              </div>
              <div>
                <dt className="font-bold">Source de la donnée</dt>
                <dd className="mt-0.5 text-muted">
                  {j.source ?? "Non renseignée"}
                  {j.sourceUrl && (
                    <>
                      {" "}
                      <a href={j.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                        Voir <ExternalLink size={12} aria-hidden />
                      </a>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Dernière mise à jour</dt>
                <dd className="mt-0.5 text-muted">{fmtDateTime(j.updatedAt)}</dd>
              </div>
              <div>
                <dt className="font-bold">Billets et réservation</dt>
                <dd className="mt-0.5 text-muted">Rihla Maroc ne vend pas de billets. Renseignez-vous auprès de la compagnie.</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="notes" className="rounded-xl border border-[#efd9a8] bg-amber-soft p-5">
            <h2 id="notes" className="mb-2 flex items-center gap-2 text-base font-extrabold text-[#6f4710]">
              <TriangleAlert size={17} aria-hidden /> Notes importantes
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#6f4710]">
              <li>Les horaires peuvent changer (saison, jours fériés, trafic). Confirmez-les auprès de la compagnie.</li>
              {j.status !== "verified" && <li>Cette information n&apos;a pas encore été vérifiée par notre équipe.</li>}
              {j.problem && <li>Point à vérifier : {j.problem}.</li>}
              {!j.price && <li>Aucun tarif vérifié n&apos;est disponible pour ce trajet.</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-6" aria-label="Compagnie et actions">
          <section className="card p-5" aria-labelledby="co">
            <h2 id="co" className="sr-only">
              Compagnie
            </h2>
            <div className="flex items-center gap-3">
              <CompanyAvatar name={j.companyName} size={52} />
              <div>
                <p className="text-lg font-extrabold">{j.companyName}</p>
                <StatusBadge status={company?.status ?? "unverified"} />
              </div>
            </div>
            {company?.description && <p className="mt-3 text-sm text-muted">{company.description}</p>}
            <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <li className="flex items-center gap-2 text-muted">
                <Phone size={15} aria-hidden /> {company?.phone ?? "Téléphone non renseigné"}
              </li>
              <li className="flex items-center gap-2 text-muted">
                <Globe size={15} aria-hidden />
                {company?.website ? (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "Site web non renseigné"
                )}
              </li>
            </ul>
            {pairs.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Autres lignes de la compagnie</p>
                <ul className="space-y-1 text-sm">
                  {pairs.slice(0, 5).map((p) => (
                    <li key={`${p.depId}-${p.arrId}`}>
                      <Link href={`/rechercher?from=${encodeURIComponent(p.depName)}&to=${encodeURIComponent(p.arrName)}`} className="hover:text-brand-700 hover:underline">
                        {p.depName} → {p.arrName}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href={`/compagnies/${j.companyId}`} className="btn btn-primary mt-5 w-full">
              Voir le profil de la compagnie
            </Link>
          </section>

          {same.length > 0 && (
            <section className="card p-5" aria-labelledby="autres">
              <h2 id="autres" className="mb-3 text-base font-extrabold">
                Autres départs {j.depName} → {j.arrName}
              </h2>
              <ul className="divide-y divide-line">
                {same.map((s) => (
                  <li key={s.id}>
                    <Link href={`/trajets/${s.id}${date ? `?date=${date}` : ""}`} className="flex items-center justify-between gap-2 py-2.5 text-sm hover:text-brand-700">
                      <span className="font-extrabold tabular-nums">{s.departureTime ?? "—"}</span>
                      <span className="flex-1 truncate text-muted">{s.companyName}</span>
                      <ArrowRight size={14} aria-hidden className="rtl-flip" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold">
              <ShieldAlert size={16} aria-hidden /> Une erreur ?
            </h2>
            <p className="text-sm text-muted">Horaire, arrêt ou contact incorrect : aidez-nous à corriger l&apos;information.</p>
            <Link href={`/aide?journey=${j.id}#signaler`} className="btn btn-outline mt-3 w-full">
              <Info size={15} aria-hidden /> Signaler une information incorrecte
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
