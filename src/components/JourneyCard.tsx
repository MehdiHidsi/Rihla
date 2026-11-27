import Link from "next/link";
import { Phone, ArrowRight, Clock } from "lucide-react";
import type { JourneyView } from "@/lib/queries";
import { CompanyAvatar, StatusBadge } from "@/components/ui";
import { FavoriteButton } from "@/components/FavoriteButton";
import { fmtDuration, fmtDateTime } from "@/lib/utils";

export function JourneyCard({
  j,
  fav,
  date,
  showRoute = false,
  extra,
}: {
  j: JourneyView;
  fav: boolean;
  date?: string;
  showRoute?: boolean;
  extra?: React.ReactNode;
}) {
  const dur = fmtDuration(j.duration);
  const href = `/trajets/${j.id}${date ? `?date=${date}` : ""}`;
  return (
    <article className="card p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyAvatar name={j.companyName} size={36} />
          <div className="min-w-0">
            <Link href={`/compagnies/${j.companyId}`} className="block truncate text-sm font-extrabold hover:text-brand-700">
              {j.companyName}
            </Link>
            {showRoute && (
              <p className="truncate text-xs text-muted">
                {j.depName} → {j.arrName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={j.status} />
          <FavoriteButton type="journey" id={j.id} initial={fav} />
        </div>
      </div>

      <div className="mt-4 grid items-center gap-4 md:grid-cols-[1fr_auto] md:gap-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5">
          <div>
            {j.departureTime ? (
              <p className="text-2xl font-extrabold tracking-tight tabular-nums sm:text-[28px]">{j.departureTime}</p>
            ) : (
              <p className="max-w-[90px] text-xs font-bold text-warn">Départ non renseigné</p>
            )}
            <p className="mt-0.5 text-xs font-semibold text-muted">{j.depName}</p>
          </div>
          <div className="min-w-[60px]">
            <p className="mb-1 flex items-center justify-center gap-1 text-center text-[11px] font-bold text-muted">
              <Clock size={11} aria-hidden /> {dur ?? "Durée non renseignée"}
            </p>
            <div className="relative flex items-center" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-700 bg-white" />
              <span className="h-0.5 flex-1 bg-gradient-to-r from-brand-700 to-amber-brand" />
              {j.stops.length > 0 && (
                <span className="absolute inset-0 flex items-center justify-evenly">
                  {j.stops.map((s) => (
                    <span key={s} className="h-1.5 w-1.5 rounded-full bg-brand-700" />
                  ))}
                </span>
              )}
              <span className="h-2.5 w-2.5 rounded-full bg-amber-brand" />
            </div>
            <p className="mt-1 text-center text-[11px] font-semibold text-muted">
              {j.stops.length > 0 ? `${j.stops.length} arrêt${j.stops.length > 1 ? "s" : ""} · ${j.stops.join(", ")}` : j.routeId ? "Direct" : "Arrêts non renseignés"}
            </p>
          </div>
          <div className="text-right">
            {j.arrivalTime ? (
              <p className="text-2xl font-extrabold tracking-tight tabular-nums sm:text-[28px]">{j.arrivalTime}</p>
            ) : (
              <p className="ml-auto max-w-[96px] text-xs font-bold text-warn">Arrivée non renseignée</p>
            )}
            <p className="mt-0.5 text-xs font-semibold text-muted">{j.arrName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line pt-3 md:flex-col md:items-end md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <div className="md:text-right">
            {j.price ? (
              <p className="text-lg font-extrabold">
                {Number(j.price)} <span className="text-xs font-bold text-muted">DH</span>
              </p>
            ) : (
              <p className="text-xs font-semibold text-muted">Prix non renseigné</p>
            )}
          </div>
          <Link href={href} className="btn btn-primary btn-sm">
            Voir les détails <ArrowRight size={14} aria-hidden className="rtl-flip" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed border-line pt-2.5 text-[11.5px] text-muted">
        {j.companyPhone && (
          <span className="inline-flex items-center gap-1">
            <Phone size={11} aria-hidden /> {j.companyPhone}
          </span>
        )}
        <span>Source : {j.source ?? "non renseignée"}</span>
        <span>Mis à jour le {fmtDateTime(j.updatedAt)}</span>
        {j.problem && <span className="font-semibold text-warn">⚠ {j.problem}</span>}
        {extra}
      </div>
    </article>
  );
}
