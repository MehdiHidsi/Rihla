import Link from "next/link";
import type { Metadata } from "next";
import { Database, ShieldCheck, Bus, Eye } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { INSPIRATION_IMAGE } from "@/lib/utils";

export const metadata: Metadata = { title: "À propos" };

export default function AboutPage() {
  return (
    <>
      <section className="container-x grid items-center gap-10 py-14 lg:grid-cols-2">
        <div>
          <LogoMark size={56} />
          <p className="eyebrow mt-6 mb-1.5">À propos</p>
          <h1 className="h-display text-4xl sm:text-5xl">Rendre les trajets en autocar plus lisibles.</h1>
          <p className="mt-5 text-[17px] text-muted">
            RIHLA MAROC (« rihla » signifie voyage) rassemble les informations sur les liaisons interurbaines en autocar : villes, compagnies, horaires et arrêts, au même endroit et dans un format clair.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/rechercher" className="btn btn-primary">
              Rechercher un trajet
            </Link>
            <Link href="/aide#signaler" className="btn btn-outline">
              Signaler une erreur
            </Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={INSPIRATION_IMAGE} alt="Route de l'Atlas" className="aspect-[4/3] w-full rounded-2xl object-cover" />
      </section>

      <section className="border-y border-line bg-surface py-14">
        <div className="container-x grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Bus, t: "Recherche et découverte", d: "Rihla est, pour l'instant, un outil d'information. Pas de réservation, de paiement ni de suivi en temps réel." },
            { i: Eye, t: "Transparence des données", d: "Chaque trajet indique sa source, sa date de mise à jour et son statut de vérification." },
            { i: ShieldCheck, t: "Aucune donnée inventée", d: "Pas de faux prix, de faux avis ni de disponibilités fictives : une information absente est signalée comme telle." },
            { i: Database, t: "Base structurée", d: "Compagnies, villes, lignes, arrêts, trajets et horaires, prêts à être alimentés par import CSV." },
          ].map((x) => (
            <div key={x.t} className="card p-5">
              <x.i className="text-brand-700" size={22} aria-hidden />
              <h2 className="mt-3 text-base font-extrabold">{x.t}</h2>
              <p className="mt-1 text-sm text-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="container-x grid gap-10 py-14 md:grid-cols-2">
        <section id="confidentialite" className="scroll-mt-24">
          <h2 className="h-display mb-3 text-2xl">Confidentialité</h2>
          <p className="text-sm text-muted">
            Nous collectons uniquement les données nécessaires : les informations de votre compte (nom, e-mail), vos favoris et vos recherches récentes. Vous pouvez effacer l&apos;historique ou supprimer votre compte à tout moment depuis votre espace.
          </p>
        </section>
        <section id="conditions" className="scroll-mt-24">
          <h2 className="h-display mb-3 text-2xl">Conditions d&apos;utilisation</h2>
          <p className="text-sm text-muted">
            Les informations sont fournies à titre indicatif et peuvent évoluer. Rihla Maroc n&apos;est pas un transporteur et n&apos;est pas responsable des changements d&apos;horaires : vérifiez toujours auprès de la compagnie avant de voyager.
          </p>
        </section>
      </div>
    </>
  );
}
