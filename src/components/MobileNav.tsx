"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Heart, User, LogOut, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/app/actions";

export function MobileNav({
  links,
  menuLabel,
  user,
  loginLabel,
  favLabel,
  accountLabel,
}: {
  links: { href: string; label: string }[];
  menuLabel: string;
  user: { name: string; role: string } | null;
  loginLabel: string;
  favLabel: string;
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button className="btn btn-outline !px-3" aria-label={menuLabel} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>
        <Menu size={20} aria-hidden />
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div id="mobile-menu" className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-sand p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button className="btn btn-ghost !px-2.5" aria-label="Fermer le menu" onClick={() => setOpen(false)}>
                <X size={22} aria-hidden />
              </button>
            </div>
            <nav aria-label="Menu mobile" className="flex flex-col">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-base font-bold">
                  {l.label}
                </Link>
              ))}
              <Link href="/favoris" onClick={() => setOpen(false)} className="flex items-center gap-2 border-b border-line py-3.5 text-base font-bold">
                <Heart size={18} aria-hidden /> {favLabel}
              </Link>
              <Link href="/aide" onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-base font-bold">
                Aide
              </Link>
            </nav>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              {user ? (
                <>
                  <Link href="/compte" onClick={() => setOpen(false)} className="btn btn-outline">
                    <User size={16} aria-hidden /> {accountLabel} — {user.name.split(" ")[0]}
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="btn btn-outline">
                      <Shield size={16} aria-hidden /> Administration
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button className="btn btn-ghost w-full text-danger">
                      <LogOut size={16} aria-hidden /> Déconnexion
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/connexion" onClick={() => setOpen(false)} className="btn btn-primary">
                    {loginLabel}
                  </Link>
                  <Link href="/inscription" onClick={() => setOpen(false)} className="btn btn-outline">
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
