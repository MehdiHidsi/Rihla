import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq, asc } from "drizzle-orm";
import { ArrowRight, Globe, Phone, Info } from "lucide-react";
import { Breadcrumb, CompanyAvatar, EmptyState, SocialIcon, StatusBadge } from "@/components/ui";
import { FavoriteButton } from "@/components/FavoriteButton";
import { JourneyCard } from "@/components/JourneyCard";
import { companyById, companyPairs, countJourneys, favoriteSet, queryJourneys } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { journeys, companies } from "@/db/schema";
import { fmtDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = Number((await params).id) ? await companyById(Number((await params).id)) : null;
  return { title: c ? `${c.name} — Compagnie` : "Compagnie" };
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!id) notFound();
  const company = await companyById(id);
  if (!company) notFound();
  const [pairs, list, total, user] = await Promise.all([
    companyPairs(id),
    queryJourneys({ where: eq(journeys.companyId, id), order: [asc(journeys.departureCityId), asc(journeys.departureTime)], limit: 8 }),
    countJourneys(eq(companies.id, id)),
    getCurrentUser(),
  ]);
  const favs = user ? await favoriteSet(user.id) : new Set<string>();
  const depCities = [...new Map(pairs.map((p) => [p.depId, p.depName])).values()];
  const arrCities = [...new Map(pairs.map((p) => [p.arrId, p.arrName])).values()];

  return (
    <div className="container-x py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Compagnies", href: "/compagnies" }, { label: company.name }]} />
      <header className="card mb-6 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4 sm:gap-5">
            <CompanyAvatar name={company.name} size={72} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="h-display text-3xl sm:text-4xl">{company.name}</h1>
                <StatusBadge status={company.status} />
              </div>
              <p className="mt-2 max-w-2xl text-[15px] text-muted">{company.description ?? "Description non renseignée."}</p>
              <p className="mt-3 text-sm font-semibold text-muted">
                {pairs.length} ligne{pairs.length > 1 ? "s" : ""} · {total} départ{total > 1 ? "s" : ""} référencé{total > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <FavoriteButton type="company" id={company.id} initial={favs.has(`company:${company.id}`)} variant="pill" label="Suivre la compagnie" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2" aria-label="Villes desservies">
            {[
              { t: "Villes de départ", items: depCities },
              { t: "Destinations", items: arrCities },
            ].map((b) => (
              <div key={b.t} className="card p-5">
                <h2 className="mb-3 text-sm font-extrabold">{b.t}</h2>
                {b.items.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {b.items.map((c) => (
                      <li key={c} className="rounded-md bg-surface px-2.5 py-1 text-[13px] font-semibold">
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Non renseigné.</p>
                )}
              </div>
            ))}
          </section>

          <section aria-labelledby="lignes">
            <h2 id="lignes" className="h-display mb-4 text-xl">
              Lignes desservies
            </h2>
            {pairs.length === 0 ? (
              <EmptyState icon={<Info />} title="Aucune ligne référencée" text="Cette compagnie n'a pas encore de trajet dans notre base." />
            ) : (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {pairs.map((p) => (
                  <li key={`${p.depId}-${p.arrId}`}>
                    <Link href={`/rechercher?from=${encodeURIComponent(p.depName)}&to=${encodeURIComponent(p.arrName)}`} className="card flex items-center justify-between gap-2 p-3.5 hover:border-brand-500">
                      <span className="text-sm font-extrabold">
                        {p.depName} → {p.arrName}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {p.n} départ{p.n > 1 ? "s" : ""}
                        {fmtDuration(p.minDur) ? ` · dès ${fmtDuration(p.minDur)}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="trajets">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 id="trajets" className="h-display text-xl">
                Trajets référencés
              </h2>
              {total > list.length && <span className="text-xs text-muted">{list.length} sur {total} affichés</span>}
            </div>
            <ul className="space-y-3">
              {list.map((j) => (
                <li key={j.id}>
                  <JourneyCard j={j} fav={favs.has(`journey:${j.id}`)} showRoute />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5" aria-label="Contact">
          <section className="card p-5">
            <h2 className="mb-4 text-base font-extrabold">Coordonnées</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="mt-0.5 text-muted" aria-hidden />
                {company.phone ? <a href={`tel:${company.phone}`} className="font-semibold text-brand-700">{company.phone}</a> : <span className="text-muted">Téléphone non renseigné</span>}
              </li>
              <li className="flex items-start gap-2.5">
                <Globe size={16} className="mt-0.5 text-muted" aria-hidden />
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="font-semibold break-all text-brand-700">
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="text-muted">Site web non renseigné</span>
                )}
              </li>
              <li className="flex items-center gap-2.5">
                <SocialIcon name="facebook" size={16} />
                {company.facebook ? <a href={company.facebook} className="font-semibold text-brand-700">Facebook</a> : <span className="text-muted">Facebook non renseigné</span>}
              </li>
              <li className="flex items-center gap-2.5">
                <SocialIcon name="instagram" size={16} />
                {company.instagram ? <a href={company.instagram} className="font-semibold text-brand-700">Instagram</a> : <span className="text-muted">Instagram non renseigné</span>}
              </li>
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Source : {company.source ?? "non renseignée"}</p>
          </section>
          <section className="card p-5">
            <h2 className="mb-1 text-base font-extrabold">Informations incorrectes ?</h2>
            <p className="text-sm text-muted">Aidez-nous à compléter ou corriger la fiche de cette compagnie.</p>
            <Link href={`/aide?company=${encodeURIComponent(company.name)}#signaler`} className="btn btn-outline mt-3 w-full">
              Signaler <ArrowRight size={14} aria-hidden className="rtl-flip" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
