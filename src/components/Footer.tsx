import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SocialIcon } from "@/components/ui";
import { LangSwitch } from "@/components/LangSwitch";
import { getLang } from "@/lib/i18n";

export async function Footer() {
  const lang = await getLang();
  const col = (title: string, items: [string, string][]) => (
    <div>
      <h2 className="mb-3 text-xs font-bold tracking-[0.14em] text-[#e0a43a] uppercase">{title}</h2>
      <ul className="space-y-2 text-sm">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-white/80 hover:text-white hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="mt-20 bg-emerald-950 text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Rihla Maroc aide à découvrir et comparer les trajets interurbains en autocar au Maroc. Plateforme d&apos;information : pas de réservation ni de paiement en ligne.
          </p>
          <div className="mt-5 flex gap-2">
            {(["facebook", "instagram", "x"] as const).map((n) => (
              <a key={n} href="#" aria-label={n === "x" ? "X (Twitter)" : n} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white/80 hover:bg-white/10">
                <SocialIcon name={n} />
              </a>
            ))}
          </div>
        </div>
        {col("Découvrir", [
          ["Rechercher un trajet", "/rechercher"],
          ["Destinations", "/destinations"],
          ["Compagnies", "/compagnies"],
          ["Mes favoris", "/favoris"],
        ])}
        {col("Rihla", [
          ["À propos", "/a-propos"],
          ["Centre d'aide", "/aide"],
          ["Signaler une erreur", "/aide#signaler"],
          ["Contact", "/aide#contact"],
        ])}
        {col("Légal", [
          ["Confidentialité", "/a-propos#confidentialite"],
          ["Conditions d'utilisation", "/a-propos#conditions"],
          ["Espace administrateur", "/admin"],
          ["États de l'interface", "/etats"],
        ])}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-white/60">
          <p>© {new Date().getFullYear()} RIHLA MAROC. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Mail size={13} aria-hidden /> contact@rihla.ma
            </span>
            <LangSwitch lang={lang} />
          </div>
        </div>
      </div>
    </footer>
  );
}
