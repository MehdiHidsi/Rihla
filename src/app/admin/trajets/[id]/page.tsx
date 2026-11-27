import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui";
import { JourneyEditor } from "@/components/AdminJourneys";
import { allCities, getJourney, getSchedule, listCompanies } from "@/lib/queries";
import { toRow } from "@/lib/admin-rows";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { fmtDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JourneyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cos, cities] = await Promise.all([listCompanies(), allCities()]);
  const opts = { companies: cos.map((c) => ({ id: c.id, name: c.name })), cities: cities.map((c) => ({ id: c.id, name: c.name })) };
  if (id === "nouveau") {
    return (
      <>
        <PageHeader title="Ajouter un trajet" subtitle="Renseignez uniquement les informations connues. Le trajet sera créé « Non vérifié » par défaut." />
        <JourneyEditor initial={null} {...opts} />
      </>
    );
  }
  const n = Number(id);
  if (!n) notFound();
  const j = await getJourney(n);
  if (!j) notFound();
  const [s, [raw]] = await Promise.all([getSchedule(n), db.select({ createdAt: journeys.createdAt }).from(journeys).where(eq(journeys.id, n))]);
  return (
    <>
      <PageHeader title={`${j.depName} → ${j.arrName}`} subtitle={`${j.companyName} · trajet n° ${j.id}`} />
      <JourneyEditor initial={toRow(j, s?.operatingDays)} {...opts} meta={{ createdAt: fmtDateTime(raw?.createdAt), updatedAt: fmtDateTime(j.updatedAt) }} />
    </>
  );
}
