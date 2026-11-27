"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Database,
  Flag,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Route as RouteIcon,
  Search,
  Settings,
  Signpost,
  Upload,
  Bus,
  X,
  ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/compagnies", label: "Compagnies", icon: Building2 },
  { href: "/admin/villes", label: "Villes", icon: MapPin },
  { href: "/admin/trajets", label: "Trajets", icon: Bus },
  { href: "/admin/routes", label: "Lignes", icon: RouteIcon },
  { href: "/admin/arrets", label: "Arrêts", icon: Signpost },
  { href: "/admin/horaires", label: "Horaires", icon: CalendarClock },
  { href: "/admin/signalements", label: "Signalements", icon: Flag, badge: "reports" as const },
  { href: "/admin/revue", label: "Revue des données", icon: ClipboardCheck, badge: "review" as const },
  { href: "/admin/import", label: "Import CSV", icon: Upload },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

const CRUMBS: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.href.split("/")[2] ?? "", n.label]));

export function AdminShell({
  user,
  badges,
  children,
}: {
  user: { name: string; email: string };
  badges: { review: number; reports: number };
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const segs = path.split("/").filter(Boolean).slice(1);
  const crumbs = [{ label: "Administration", href: "/admin" }, ...segs.map((s, i) => ({ label: CRUMBS[s] ?? (s === "nouveau" ? "Nouveau" : `#${s}`), href: "/admin/" + segs.slice(0, i + 1).join("/") }))];

  const sidebar = (
    <div className="flex h-full flex-col bg-emerald-950 text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Logo light href="/admin" />
        <button className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden" aria-label="Fermer le menu" onClick={() => setOpen(false)}>
          <X size={20} aria-hidden />
        </button>
      </div>
      <nav aria-label="Navigation administration" className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((n) => {
          const active = n.exact ? path === n.href : path.startsWith(n.href);
          const count = n.badge ? badges[n.badge] : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
            >
              <n.icon size={17} aria-hidden />
              <span className="flex-1">{n.label}</span>
              {count > 0 && <span className="rounded-full bg-amber-brand px-2 py-0.5 text-[11px] font-bold">{count}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white/75 hover:bg-white/10">
          <ExternalLink size={16} aria-hidden /> Voir le site public
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu administration">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</div>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button className="btn btn-outline !px-2.5 lg:hidden" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}>
            <Menu size={20} aria-hidden />
          </button>
          <form action="/admin/trajets" role="search" className="relative hidden max-w-sm flex-1 sm:block">
            <label htmlFor="admin-q" className="sr-only">
              Rechercher un trajet, une compagnie ou une ville
            </label>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
            <input id="admin-q" name="q" className="field !min-h-10 pl-9" placeholder="Rechercher un trajet, une ville…" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/signalements" className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface" aria-label={`Signalements en attente : ${badges.reports}`}>
              <Bell size={18} aria-hidden />
              {badges.reports > 0 && <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-brand" />}
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">{user.name[0]}</span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[13px] font-bold">{user.name}</span>
                  <span className="block text-[11px] text-muted">Administrateur</span>
                </span>
              </summary>
              <div className="card absolute right-0 mt-2 w-56 p-1.5 shadow-lg">
                <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
                <form action={logoutAction}>
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-danger hover:bg-surface">
                    <LogOut size={15} aria-hidden /> Déconnexion
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main id="contenu" className="mx-auto max-w-[1400px] p-4 sm:p-6">
          <nav aria-label="Fil d'Ariane" className="mb-4 text-[13px] text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  {i < crumbs.length - 1 ? (
                    <Link href={c.href} className="hover:text-brand-700 hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-bold text-ink">
                      {c.label}
                    </span>
                  )}
                  {i < crumbs.length - 1 && <span aria-hidden>/</span>}
                </li>
              ))}
            </ol>
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminIcon() {
  return <Database aria-hidden />;
}
