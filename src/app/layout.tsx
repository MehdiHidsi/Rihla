import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/manrope";
import "./globals.css";
import { getLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { default: "RIHLA MAROC — Trajets en autocar au Maroc", template: "%s · RIHLA MAROC" },
  description: "Comparez les trajets interurbains en autocar au Maroc, découvrez les compagnies et les destinations.",
};

export const viewport: Viewport = { themeColor: "#0f5037", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
