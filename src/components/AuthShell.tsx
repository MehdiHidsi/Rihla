import type { ReactNode } from "react";
import { HERO_IMAGE } from "@/lib/utils";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="container-x py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-line bg-white shadow-sm md:grid-cols-[1fr_1.1fr]">
        <div className="relative hidden min-h-[520px] bg-emerald-950 md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/40 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-8 text-white">
            <p className="eyebrow !text-[#f0c26a]">RIHLA MAROC</p>
            <p className="mt-2 text-2xl font-extrabold leading-tight">Gardez vos trajets, villes et compagnies préférés à portée de main.</p>
            <p className="mt-3 text-sm text-white/80">La recherche reste accessible à tous, sans compte.</p>
          </div>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="h-display text-2xl sm:text-3xl">{title}</h1>
          <p className="mt-1.5 mb-6 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
