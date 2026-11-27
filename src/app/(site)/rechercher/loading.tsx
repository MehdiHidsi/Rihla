import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div role="status" aria-label="Chargement des résultats">
      <div className="border-b border-line bg-surface">
        <div className="container-x py-6">
          <Skeleton className="mb-3 h-8 w-72" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-96 lg:block" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
