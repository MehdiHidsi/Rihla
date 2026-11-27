import type { Metadata } from "next";
import { Search, Route as RouteIcon, Building2, Mail, Flag, MessageSquare, ChevronDown, LifeBuoy } from "lucide-react";
import { ReportForm, FeedbackForm } from "@/components/SupportForms";
import { getJourney } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Centre d'aide" };

const FAQ = [
  { q: "Puis-je réserver un billet sur Rihla Maroc ?", a: "Non. Rihla Maroc est une plateforme de recherche et d'information : elle n'effectue ni réservation, ni paiement, ni sélection de siège. Contactez directement la compagnie pour acheter votre billet." },
  { q: "Les horaires sont-ils fiables ?", a: "Chaque trajet affiche un statut : « Vérifié », « Non vérifié » ou « À vérifier », ainsi que sa source. Les horaires peuvent changer : confirmez-les toujours auprès de l'opérateur avant de voyager." },
  { q: "Pourquoi certains trajets n'ont pas de prix ?", a: "Nous n'affichons un prix que s'il est vérifié. Sinon, la mention « Prix non renseigné » apparaît : nous ne publions jamais de tarif estimé." },
  { q: "Où voir la position de mon bus en direct ?", a: "Le suivi en temps réel n'est pas disponible. La carte du trajet est un schéma indicatif de l'itinéraire." },
  { q: "Dois-je créer un compte ?", a: "Non, la recherche est libre. Un compte permet seulement d'enregistrer des favoris et de retrouver vos recherches." },
  { q: "Comment signaler une erreur ?", a: "Utilisez le formulaire « Signaler un trajet incorrect » ci-dessous ou le bouton présent sur chaque fiche de trajet." },
];

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ journey?: string; company?: string }> }) {
  const sp = await searchParams;
  const j = sp.journey && Number(sp.journey) ? await getJourney(Number(sp.journey)) : null;
  const defaults = {
    route: j ? `${j.depName} → ${j.arrName}` : undefined,
    company: j?.companyName ?? sp.company,
    journeyId: j?.id,
  };
  const topics = [
    { icon: Search, title: "Aide à la recherche", text: "Saisissez une ville dans la liste proposée, choisissez une date puis lancez la recherche. Utilisez les filtres pour affiner.", href: "#faq" },
    { icon: RouteIcon, title: "Informations sur les trajets", text: "Heures, durée, arrêts, source et statut de vérification sont indiqués lorsque disponibles.", href: "#faq" },
    { icon: Building2, title: "Informations sur les compagnies", text: "Contacts, villes desservies et lignes proviennent de nos sources, citées sur chaque fiche.", href: "#faq" },
    { icon: Mail, title: "Contacter le support", text: "Écrivez-nous pour toute question ou proposition de partenariat.", href: "#contact" },
  ];
  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-x py-12">
          <p className="eyebrow mb-1.5">Support</p>
          <h1 className="h-display text-3xl sm:text-4xl">Comment pouvons-nous vous aider ?</h1>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((t) => (
              <li key={t.title}>
                <a href={t.href} className="card block h-full p-5 hover:border-brand-500">
                  <t.icon size={22} className="text-brand-700" aria-hidden />
                  <h2 className="mt-3 text-base font-extrabold">{t.title}</h2>
                  <p className="mt-1 text-[13px] text-muted">{t.text}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_1fr]">
        <section id="faq" aria-labelledby="faq-t" className="scroll-mt-24">
          <h2 id="faq-t" className="h-display mb-5 text-2xl">
            Questions fréquentes
          </h2>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="card group p-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-extrabold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-4 pb-4 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>

          <div id="contact" className="card mt-8 scroll-mt-24 p-5">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-extrabold">
              <LifeBuoy size={18} aria-hidden /> Contacter le support
            </h2>
            <p className="text-sm text-muted">
              E-mail : <a className="font-bold text-brand-700" href="mailto:contact@rihla.ma">contact@rihla.ma</a>
              <br />
              Nous répondons généralement sous quelques jours ouvrés.
            </p>
          </div>
        </section>

        <div className="space-y-8">
          <section id="signaler" aria-labelledby="sig-t" className="card scroll-mt-24 p-5 sm:p-7">
            <h2 id="sig-t" className="mb-1 flex items-center gap-2 text-xl font-extrabold">
              <Flag size={19} aria-hidden /> Signaler un trajet incorrect
            </h2>
            <p className="mb-5 text-sm text-muted">Horaire, arrêt, ville ou contact erroné : dites-nous ce qui doit être corrigé.</p>
            <ReportForm defaults={defaults} key={`${defaults.journeyId}-${defaults.company}`} />
          </section>
          <section id="avis" aria-labelledby="avis-t" className="card scroll-mt-24 p-5 sm:p-7">
            <h2 id="avis-t" className="mb-1 flex items-center gap-2 text-xl font-extrabold">
              <MessageSquare size={19} aria-hidden /> Donner votre avis
            </h2>
            <p className="mb-5 text-sm text-muted">Aidez-nous à améliorer la plateforme.</p>
            <FeedbackForm />
          </section>
        </div>
      </div>
    </>
  );
}
