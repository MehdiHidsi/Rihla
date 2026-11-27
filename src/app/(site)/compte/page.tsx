import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell, Heart, History, Languages, Lock, LogOut, Settings, User } from "lucide-react";
import { getCurrentUser, getOwnerKey } from "@/lib/auth";
import { recentFor, userFavorites } from "@/lib/queries";
import { ProfileForm, PasswordForm, DeleteAccount } from "@/components/AccountForms";
import { RecentSearches } from "@/components/RecentSearches";
import { LangSwitch } from "@/components/LangSwitch";
import { EmptyState } from "@/components/ui";
import { getLang } from "@/lib/i18n";
import { logoutAction } from "@/app/actions";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon compte" };

const NAV = [
  { k: "profil", label: "Profil", icon: User },
  { k: "favoris", label: "Favoris", icon: Heart },
  { k: "recherches", label: "Recherches récentes", icon: History },
  { k: "notifications", label: "Notifications", icon: Bell },
  { k: "langue", label: "Langue", icon: Languages },
  { k: "parametres", label: "Paramètres du compte", icon: Settings },
];

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte");
  const s = (await searchParams).s ?? "profil";
  const lang = await getLang();
  const [fav, recent] = await Promise.all([userFavorites(user.id), recentFor(await getOwnerKey(), 10)]);

  return (
    <div className="container-x py-10">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-xl font-extrabold text-white">{user.name[0]?.toUpperCase()}</span>
        <div>
          <h1 className="h-display text-2xl sm:text-3xl">{user.name}</h1>
          <p className="text-sm text-muted">
            {user.email} · Membre depuis le {fmtDate(user.createdAt.toISOString().slice(0, 10), { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <nav aria-label="Navigation du compte" className="card h-fit p-2 max-md:flex max-md:overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.k}
              href={`/compte?s=${n.k}`}
              aria-current={s === n.k ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold whitespace-nowrap ${s === n.k ? "bg-brand-50 text-brand-700" : "hover:bg-surface"}`}
            >
              <n.icon size={16} aria-hidden /> {n.label}
            </Link>
          ))}
          <form action={logoutAction} className="md:mt-1 md:border-t md:border-line md:pt-1">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold whitespace-nowrap text-danger hover:bg-surface">
              <LogOut size={16} aria-hidden /> Déconnexion
            </button>
          </form>
        </nav>

        <section className="card p-5 sm:p-7" aria-live="polite">
          {s === "profil" && (
            <>
              <h2 className="mb-1 text-xl font-extrabold">Modifier le profil</h2>
              <p className="mb-5 text-sm text-muted">Ces informations ne sont utilisées que pour votre compte.</p>
              <ProfileForm name={user.name} email={user.email} />
            </>
          )}
          {s === "favoris" && (
            <>
              <h2 className="mb-4 text-xl font-extrabold">Mes favoris</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { l: "Routes", n: fav.journeys.length, h: "routes" },
                  { l: "Villes", n: fav.cities.length, h: "villes" },
                  { l: "Compagnies", n: fav.companies.length, h: "compagnies" },
                ].map((x) => (
                  <Link key={x.l} href={`/favoris?tab=${x.h}`} className="rounded-xl border border-line bg-sand p-4 hover:border-brand-500">
                    <p className="text-3xl font-extrabold">{x.n}</p>
                    <p className="text-sm font-semibold text-muted">{x.l} favorites</p>
                  </Link>
                ))}
              </div>
              <Link href="/favoris" className="btn btn-primary mt-5">
                Gérer mes favoris
              </Link>
            </>
          )}
          {s === "recherches" && (
            <>
              <h2 className="mb-4 text-xl font-extrabold">Recherches récentes</h2>
              <RecentSearches items={recent} compact />
            </>
          )}
          {s === "notifications" && (
            <>
              <h2 className="mb-4 text-xl font-extrabold">Notifications</h2>
              <EmptyState icon={<Bell />} title="Aucune notification" text="Vous serez averti ici lorsqu'une information liée à vos favoris sera mise à jour." />
            </>
          )}
          {s === "langue" && (
            <>
              <h2 className="mb-1 text-xl font-extrabold">Langue</h2>
              <p className="mb-5 text-sm text-muted">Choisissez la langue d&apos;affichage (français ou arabe). L&apos;arabe active la lecture de droite à gauche.</p>
              <LangSwitch lang={lang} />
            </>
          )}
          {s === "parametres" && (
            <>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-extrabold">
                <Lock size={18} aria-hidden /> Sécurité et compte
              </h2>
              <PasswordForm />
              <div className="mt-8 border-t border-line pt-6">
                <h3 className="mb-1 text-base font-extrabold text-danger">Zone sensible</h3>
                <p className="mb-3 text-sm text-muted">La suppression du compte efface vos favoris et recherches.</p>
                <DeleteAccount />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
