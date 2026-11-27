import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { Lock } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { db } from "@/db";
import { journeys, reports } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4">
        <Logo />
        <div className="card mt-8 max-w-md p-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f8e6e3] text-danger">
            <Lock />
          </span>
          <h1 className="text-xl font-extrabold">Accès réservé aux administrateurs</h1>
          <p className="mt-1.5 text-sm text-muted">
            {user ? "Votre compte ne dispose pas des droits nécessaires pour accéder à cet espace." : "Connectez-vous avec un compte administrateur pour gérer la base de données des trajets."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {!user && (
              <Link href="/connexion?next=/admin" className="btn btn-primary">
                Se connecter
              </Link>
            )}
            <Link href="/" className="btn btn-outline">
              Retour au site
            </Link>
          </div>
          <p className="mt-6 rounded-lg bg-amber-soft p-3 text-left text-xs text-[#6f4710]">
            <strong>Aperçu de démonstration</strong> — compte administrateur : <code>admin@rihla.ma</code> / <code>Admin2026!</code>
          </p>
        </div>
      </div>
    );
  }
  await ensureSeed();
  const [[r], [p]] = await Promise.all([
    db.select({ n: count() }).from(journeys).where(eq(journeys.verificationStatus, "needs_review")),
    db.select({ n: count() }).from(reports).where(eq(reports.status, "pending")),
  ]);
  return (
    <AdminShell user={{ name: user.name, email: user.email }} badges={{ review: r.n, reports: p.n }}>
      {children}
    </AdminShell>
  );
}
