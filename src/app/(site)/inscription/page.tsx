import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <AuthShell title="Créer un compte" subtitle="Gratuit. Enregistrez vos trajets, villes et compagnies favoris.">
      <RegisterForm />
    </AuthShell>
  );
}
