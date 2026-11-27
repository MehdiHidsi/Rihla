"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { History, RotateCcw, Trash2, X } from "lucide-react";
import { clearRecentAction, deleteRecentAction } from "@/app/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { fmtDate } from "@/lib/utils";

export type RecentItem = { id: number; origin: string; destination: string; travelDate: string | null; passengers: number };

export function RecentSearches({ items, compact = false }: { items: RecentItem[]; compact?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-muted">
        <History className="mx-auto mb-2 text-muted" size={22} aria-hidden />
        Aucune recherche récente. Vos prochaines recherches apparaîtront ici.
      </div>
    );
  }
  const href = (r: RecentItem) => {
    const qs = new URLSearchParams({ from: r.origin, to: r.destination, pax: String(r.passengers) });
    if (r.travelDate) qs.set("date", r.travelDate);
    return `/rechercher?${qs}`;
  };
  return (
    <section aria-label="Recherches récentes">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <History size={17} aria-hidden /> Recherches récentes
        </h2>
        <button className="inline-flex items-center gap-1 text-[13px] font-bold text-danger hover:underline" onClick={() => setConfirm(true)}>
          <Trash2 size={14} aria-hidden /> Tout effacer
        </button>
      </div>
      <ul className={`grid gap-2.5 ${compact ? "" : "sm:grid-cols-2"}`}>
        {items.map((r) => (
          <li key={r.id} className="card flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">
                {r.origin} → {r.destination}
              </p>
              <p className="text-xs text-muted">
                {r.travelDate ? fmtDate(r.travelDate, { day: "numeric", month: "short" }) : "Date flexible"} · {r.passengers} passager{r.passengers > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link href={href(r)} className="btn btn-outline btn-sm" aria-label={`Rechercher à nouveau ${r.origin} vers ${r.destination}`}>
                <RotateCcw size={13} aria-hidden /> Relancer
              </Link>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-danger"
                aria-label={`Supprimer la recherche ${r.origin} vers ${r.destination}`}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteRecentAction(r.id);
                    router.refresh();
                  })
                }
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={confirm}
        danger
        title="Effacer l'historique ?"
        description="Toutes vos recherches récentes seront supprimées. Cette action est irréversible."
        confirmLabel="Tout effacer"
        busy={pending}
        onClose={() => setConfirm(false)}
        onConfirm={() =>
          start(async () => {
            await clearRecentAction();
            setConfirm(false);
            router.refresh();
          })
        }
      />
    </section>
  );
}
