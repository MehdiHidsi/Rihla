import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Connexion" subtitle="Retrouvez vos favoris et vos recherches récentes.">
      <LoginForm next={next} />
    </AuthShell>
  );
}
