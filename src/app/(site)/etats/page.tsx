import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  CloudOff,
  FileWarning,
  Heart,
  Hourglass,
  Lock,
  SearchX,
  ServerCrash,
  TriangleAlert,
  Upload,
  Building2,
  MapPin,
} from "lucide-react";
import { EmptyState, Skeleton, StatusBadge } from "@/components/ui";
import { ConfirmDemo } from "@/components/ConfirmDemo";

export const metadata: Metadata = { title: "États de l'interface" };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold tracking-widest text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function StatesPage() {
  return (
    <div className="container-x py-10">
      <p className="eyebrow mb-1.5">Design system</p>
      <h1 className="h-display text-3xl sm:text-4xl">États de l&apos;interface</h1>
      <p className="mt-2 mb-10 max-w-2xl text-[15px] text-muted">
        Référence des états utilisés dans Rihla Maroc : chargement, vide, erreur, validation et confirmation. Chaque état propose une action claire.
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        <Block title="Chargement — skeleton">
          <div className="card space-y-3 p-5" role="status" aria-label="Chargement">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Block>
        <Block title="Recherche vide">
          <EmptyState icon={<SearchX />} title="Où souhaitez-vous aller ?" text="Choisissez deux villes pour afficher les trajets." action={<Link href="/rechercher" className="btn btn-primary">Rechercher un trajet</Link>} />
        </Block>
        <Block title="Aucun favori">
          <EmptyState icon={<Heart />} title="Vous n'avez pas encore de favoris." action={<Link href="/rechercher" className="btn btn-primary">Explorer les trajets</Link>} />
        </Block>
        <Block title="Aucune compagnie / aucune ville">
          <div className="grid gap-3 sm:grid-cols-2">
            <EmptyState icon={<Building2 />} title="Aucune compagnie" text="Ajoutez-en ou importez un CSV." />
            <EmptyState icon={<MapPin />} title="Aucune ville" text="Ajoutez une ville ou modifiez le filtre." />
          </div>
        </Block>
        <Block title="Erreur réseau">
          <EmptyState tone="error" icon={<CloudOff />} title="Connexion impossible" text="Vérifiez votre connexion internet puis réessayez." action={<button className="btn btn-primary">Réessayer</button>} />
        </Block>
        <Block title="Erreur serveur">
          <EmptyState tone="error" icon={<ServerCrash />} title="Un problème est survenu" text="Notre service rencontre une difficulté. Réessayez dans quelques instants." action={<Link href="/" className="btn btn-outline">Retour à l&apos;accueil</Link>} />
        </Block>
        <Block title="Formulaire invalide">
          <div className="card space-y-3 p-5">
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-[#ecc4be] bg-[#f8e6e3] px-3 py-2.5 text-sm font-semibold text-danger">
              <TriangleAlert size={16} className="mt-0.5" aria-hidden /> Veuillez corriger les champs signalés.
            </div>
            <label className="label" htmlFor="demo-mail">Adresse e-mail</label>
            <input id="demo-mail" className="field" aria-invalid="true" aria-describedby="demo-mail-err" defaultValue="vous@exemple" />
            <p id="demo-mail-err" className="text-xs font-semibold text-danger">Adresse e-mail invalide.</p>
          </div>
        </Block>
        <Block title="Envoi réussi">
          <div className="rounded-xl border border-[#c3dfcf] bg-[#e5f2ea] p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 text-ok" size={32} aria-hidden />
            <p className="text-lg font-extrabold">Merci, votre signalement est envoyé</p>
            <p className="text-sm text-muted">Notre équipe va le vérifier.</p>
          </div>
        </Block>
        <Block title="Horaire / prix manquant, données non vérifiées">
          <div className="card space-y-3 p-5 text-sm">
            <p><span className="font-bold text-warn">Arrivée non renseignée</span> — l&apos;heure d&apos;arrivée est absente de la source.</p>
            <p className="text-muted">Prix non renseigné — jamais « 0 DH ».</p>
            <p className="text-muted">Jours de circulation non renseignés.</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="unverified" />
              <StatusBadge status="needs_review" />
              <StatusBadge status="verified" />
              <StatusBadge status="rejected" />
            </div>
          </div>
        </Block>
        <Block title="Données en attente de revue">
          <EmptyState tone="warn" icon={<Hourglass />} title="12 trajets en attente de revue" text="Ces informations sont masquées du label « Vérifié » jusqu'à validation." action={<Link href="/admin/revue" className="btn btn-primary">Ouvrir la file de revue</Link>} />
        </Block>
        <Block title="Échec de validation CSV">
          <EmptyState tone="error" icon={<FileWarning />} title="3 erreurs bloquantes" text="Ligne 4 : ville d'arrivée inconnue. Corrigez le fichier puis réimportez-le." action={<button className="btn btn-outline"><Upload size={15} aria-hidden /> Choisir un autre fichier</button>} />
        </Block>
        <Block title="Permission refusée">
          <EmptyState tone="error" icon={<Lock />} title="Accès réservé aux administrateurs" text="Connectez-vous avec un compte autorisé." action={<Link href="/connexion" className="btn btn-primary">Se connecter</Link>} />
        </Block>
        <Block title="Boîte de confirmation">
          <div className="card p-5">
            <ConfirmDemo />
          </div>
        </Block>
      </div>
    </div>
  );
}
