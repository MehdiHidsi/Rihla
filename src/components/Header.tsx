import Link from "next/link";
import { Heart, Search, User, ChevronDown, LogOut, Shield, UserCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MobileNav } from "@/components/MobileNav";
import { LangSwitch } from "@/components/LangSwitch";
import { getCurrentUser } from "@/lib/auth";
import { getLang, t } from "@/lib/i18n";
import { logoutAction } from "@/app/actions";

export async function Header() {
  const [user, lang] = await Promise.all([getCurrentUser(), getLang()]);
  const d = t(lang);
  const links = [
    { href: "/", label: d.home },
    { href: "/rechercher", label: d.search },
    { href: "/destinations", label: d.destinations },
    { href: "/compagnies", label: d.companies },
    { href: "/a-propos", label: d.about },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sand/95 backdrop-blur">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Aller au contenu
      </a>
      <div className="container-x flex h-[68px] items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-surface hover:text-brand-700">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/rechercher" aria-label={d.search} className="btn btn-ghost !px-2.5 lg:hidden xl:inline-flex">
            <Search size={18} aria-hidden />
          </Link>
          <Link href="/favoris" className="btn btn-ghost hidden !px-3 sm:inline-flex" aria-label={d.favorites}>
            <Heart size={18} aria-hidden />
            <span className="hidden xl:inline">{d.favorites}</span>
          </Link>
          <LangSwitch lang={lang} />
          {user ? (
            <details className="relative hidden lg:block">
              <summary className="btn btn-outline cursor-pointer list-none !gap-1.5 [&::-webkit-details-marker]:hidden">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
                  {user.name[0]?.toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate">{user.name.split(" ")[0]}</span>
                <ChevronDown size={14} aria-hidden />
              </summary>
              <div className="card absolute right-0 mt-2 w-56 p-1.5 shadow-lg">
                <Link href="/compte" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface">
                  <UserCircle size={16} aria-hidden /> {d.account}
                </Link>
                <Link href="/favoris" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface">
                  <Heart size={16} aria-hidden /> {d.favorites}
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface">
                    <Shield size={16} aria-hidden /> Administration
                  </Link>
                )}
                <form action={logoutAction}>
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-danger hover:bg-surface">
                    <LogOut size={16} aria-hidden /> Déconnexion
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link href="/connexion" className="btn btn-primary hidden lg:inline-flex">
              <User size={16} aria-hidden /> {d.login}
            </Link>
          )}
          <MobileNav
            links={links}
            menuLabel={d.menu}
            user={user ? { name: user.name, role: user.role } : null}
            loginLabel={d.login}
            favLabel={d.favorites}
            accountLabel={d.account}
          />
        </div>
      </div>
    </header>
  );
}
