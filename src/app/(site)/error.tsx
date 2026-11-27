"use client";

import Link from "next/link";
import { ServerCrash } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-16">
      <div className="card mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f8e6e3] text-danger">
          <ServerCrash />
        </span>
        <h1 className="text-xl font-extrabold">Un problème est survenu</h1>
        <p className="mt-1.5 text-sm text-muted">Le service est momentanément indisponible. Réessayez dans un instant.</p>
        <div className="mt-5 flex gap-2">
          <button onClick={reset} className="btn btn-primary">
            Réessayer
          </button>
          <Link href="/" className="btn btn-outline">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
