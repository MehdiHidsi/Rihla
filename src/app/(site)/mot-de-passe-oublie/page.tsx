import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Saisissez votre e-mail, nous vous enverrons un lien de réinitialisation.">
      <ForgotForm />
    </AuthShell>
  );
}
