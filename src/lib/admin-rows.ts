import type { JourneyView } from "@/lib/queries";
import type { AdminJourneyRow } from "@/components/AdminJourneys";
import { fmtDateTime } from "@/lib/utils";

export function toRow(j: JourneyView, operatingDays?: string | null): AdminJourneyRow {
  return {
    id: j.id,
    companyId: j.companyId,
    companyName: j.companyName,
    depId: j.depId,
    depName: j.depName,
    arrId: j.arrId,
    arrName: j.arrName,
    departureTime: j.departureTime,
    arrivalTime: j.arrivalTime,
    duration: j.duration,
    price: j.price,
    source: j.source,
    sourceUrl: j.sourceUrl,
    problem: j.problem,
    notes: j.notes,
    status: j.status,
    stops: j.stops,
    updatedAt: fmtDateTime(j.updatedAt),
    operatingDays: operatingDays ?? null,
  };
}
