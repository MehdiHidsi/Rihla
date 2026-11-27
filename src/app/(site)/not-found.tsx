import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-x py-16">
      <div className="card mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <SearchX />
        </span>
        <h1 className="text-xl font-extrabold">Page introuvable</h1>
        <p className="mt-1.5 text-sm text-muted">Cette page n&apos;existe pas ou le trajet a été retiré.</p>
        <div className="mt-5 flex gap-2">
          <Link href="/rechercher" className="btn btn-primary">
            Rechercher un trajet
          </Link>
          <Link href="/" className="btn btn-outline">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
