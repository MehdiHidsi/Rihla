"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { cities, companies, journeys, reports, routeStops, routes, schedules } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { normalizeText, slugify } from "@/lib/utils";

export type AdminResult = { ok?: boolean; error?: string; id?: number; fieldErrors?: Record<string, string> };

async function guard(): Promise<AdminResult | null> {
  const a = await requireAdmin();
  return a ? null : { error: "Permission refusée : action réservée aux administrateurs." };
}

const clean = (s?: string | null) => (s && s.trim() ? s.trim() : null);
const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/;

// ---------- Companies ----------
export type CompanyInput = {
  id?: number;
  name: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  description: string;
  notes: string;
  source: string;
  status: string;
};

export async function saveCompanyAction(i: CompanyInput): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  if (i.name.trim().length < 2) return { error: "Le nom de la compagnie est obligatoire.", fieldErrors: { name: "Nom obligatoire." } };
  if (i.website && !/^https?:\/\//.test(i.website.trim())) return { error: "Le site web doit commencer par http:// ou https://.", fieldErrors: { website: "URL invalide." } };
  const slug = slugify(i.name);
  const [dup] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, slug)).limit(1);
  if (dup && dup.id !== i.id) return { error: "Une compagnie portant ce nom existe déjà.", fieldErrors: { name: "Nom déjà utilisé." } };
  const values = {
    name: i.name.trim(),
    slug,
    phone: clean(i.phone),
    website: clean(i.website),
    facebook: clean(i.facebook),
    instagram: clean(i.instagram),
    description: clean(i.description),
    notes: clean(i.notes),
    source: clean(i.source),
    status: i.status || "needs_review",
    updatedAt: new Date(),
  };
  if (i.id) await db.update(companies).set(values).where(eq(companies.id, i.id));
  else await db.insert(companies).values(values);
  revalidatePath("/admin", "layout");
  revalidatePath("/compagnies");
  return { ok: true };
}

export async function deleteCompanyAction(id: number): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  const [{ n }] = await db.select({ n: count() }).from(journeys).where(eq(journeys.companyId, id));
  const [{ r }] = await db.select({ r: count() }).from(routes).where(eq(routes.companyId, id));
  if (n > 0 || r > 0) return { error: `Suppression impossible : ${n} trajet(s) et ${r} ligne(s) sont liés à cette compagnie. Supprimez-les d'abord.` };
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- Cities ----------
export type CityInput = { id?: number; name: string; region: string; category: string; description: string; status: string };

export async function saveCityAction(i: CityInput): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  if (i.name.trim().length < 2) return { error: "Le nom de la ville est obligatoire.", fieldErrors: { name: "Nom obligatoire." } };
  const slug = slugify(i.name);
  const [dup] = await db.select({ id: cities.id }).from(cities).where(eq(cities.slug, slug)).limit(1);
  if (dup && dup.id !== i.id) return { error: "Cette ville existe déjà.", fieldErrors: { name: "Ville déjà existante." } };
  const values = {
    name: i.name.trim(),
    slug,
    region: clean(i.region),
    category: clean(i.category),
    description: clean(i.description),
    status: i.status || "verified",
    updatedAt: new Date(),
  };
  if (i.id) await db.update(cities).set(values).where(eq(cities.id, i.id));
  else await db.insert(cities).values(values);
  revalidatePath("/admin", "layout");
  revalidatePath("/destinations");
  return { ok: true };
}

async function cityUsage(id: number) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(journeys)
    .where(or(eq(journeys.departureCityId, id), eq(journeys.arrivalCityId, id)));
  const [{ r }] = await db
    .select({ r: count() })
    .from(routes)
    .where(or(eq(routes.departureCityId, id), eq(routes.arrivalCityId, id)));
  const [{ s }] = await db.select({ s: count() }).from(routeStops).where(eq(routeStops.stopCityId, id));
  return { n, r, s };
}

export async function deleteCityAction(id: number): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  const u = await cityUsage(id);
  if (u.n + u.r + u.s > 0)
    return { error: `Suppression bloquée : ville utilisée par ${u.n} trajet(s), ${u.r} ligne(s) et ${u.s} arrêt(s). Fusionnez-la ou retirez ces liens.` };
  await db.delete(cities).where(eq(cities.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function mergeCitiesAction(sourceId: number, targetId: number): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  if (sourceId === targetId) return { error: "Choisissez deux villes différentes." };
  await db.update(journeys).set({ departureCityId: targetId }).where(eq(journeys.departureCityId, sourceId));
  await db.update(journeys).set({ arrivalCityId: targetId }).where(eq(journeys.arrivalCityId, sourceId));
  await db.update(routes).set({ departureCityId: targetId }).where(eq(routes.departureCityId, sourceId));
  await db.update(routes).set({ arrivalCityId: targetId }).where(eq(routes.arrivalCityId, sourceId));
  await db.update(routeStops).set({ stopCityId: targetId }).where(eq(routeStops.stopCityId, sourceId));
  await db.delete(cities).where(eq(cities.id, sourceId));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- Journeys ----------
export type JourneyInput = {
  id?: number;
  companyId: number;
  depId: number;
  arrId: number;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  source: string;
  sourceUrl: string;
  status: string;
  problem: string;
  notes: string;
  operatingDays: string;
};

function validateJourney(i: JourneyInput): AdminResult | null {
  const fe: Record<string, string> = {};
  if (!i.companyId) fe.companyId = "Choisissez une compagnie.";
  if (!i.depId) fe.depId = "Choisissez la ville de départ.";
  if (!i.arrId) fe.arrId = "Choisissez la ville d'arrivée.";
  if (i.depId && i.depId === i.arrId) fe.arrId = "L'arrivée doit différer du départ.";
  if (i.departureTime && !timeRe.test(i.departureTime)) fe.departureTime = "Format attendu : HH:MM.";
  if (i.arrivalTime && !timeRe.test(i.arrivalTime)) fe.arrivalTime = "Format attendu : HH:MM.";
  if (i.duration && !(Number(i.duration) > 0)) fe.duration = "Durée en minutes (> 0).";
  if (i.price && !(Number(i.price) > 0)) fe.price = "Prix valide requis (ou laisser vide).";
  if (i.status === "verified") {
    if (!i.departureTime) fe.status = "Impossible de marquer « Vérifié » sans heure de départ.";
    else if (!clean(i.source) && !clean(i.sourceUrl)) fe.status = "Impossible de marquer « Vérifié » sans source.";
  }
  return Object.keys(fe).length ? { error: Object.values(fe)[0], fieldErrors: fe } : null;
}

async function ensureRoute(companyId: number, depId: number, arrId: number) {
  const [r] = await db
    .select({ id: routes.id })
    .from(routes)
    .where(and(eq(routes.companyId, companyId), eq(routes.departureCityId, depId), eq(routes.arrivalCityId, arrId)))
    .limit(1);
  if (r) return r.id;
  const [n] = await db.insert(routes).values({ companyId, departureCityId: depId, arrivalCityId: arrId }).returning({ id: routes.id });
  return n.id;
}

export async function saveJourneyAction(i: JourneyInput): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  const v = validateJourney(i);
  if (v) return v;
  const routeId = await ensureRoute(i.companyId, i.depId, i.arrId);
  const values = {
    companyId: i.companyId,
    routeId,
    departureCityId: i.depId,
    arrivalCityId: i.arrId,
    departureTime: clean(i.departureTime),
    arrivalTime: clean(i.arrivalTime),
    durationMinutes: i.duration ? Math.round(Number(i.duration)) : null,
    price: i.price ? String(Number(i.price)) : null,
    source: clean(i.source),
    sourceUrl: clean(i.sourceUrl),
    verificationStatus: i.status || "unverified",
    problem: clean(i.problem),
    notes: clean(i.notes),
    updatedAt: new Date(),
  };
  let id = i.id;
  if (id) await db.update(journeys).set(values).where(eq(journeys.id, id));
  else {
    const [n] = await db.insert(journeys).values(values).returning({ id: journeys.id });
    id = n.id;
  }
  await db.delete(schedules).where(eq(schedules.journeyId, id));
  if (clean(i.operatingDays)) await db.insert(schedules).values({ journeyId: id, operatingDays: i.operatingDays.trim() });
  revalidatePath("/admin", "layout");
  return { ok: true, id };
}

export async function duplicateJourneyAction(id: number): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  const [j] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1);
  if (!j) return { error: "Trajet introuvable." };
  const { id: _omit, ...rest } = j;
  void _omit;
  const [n] = await db
    .insert(journeys)
    .values({ ...rest, verificationStatus: "unverified", problem: "Copie à vérifier", updatedAt: new Date(), createdAt: new Date() })
    .returning({ id: journeys.id });
  revalidatePath("/admin", "layout");
  return { ok: true, id: n.id };
}

export async function deleteJourneyAction(id: number): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  await db.delete(schedules).where(eq(schedules.journeyId, id));
  await db.delete(journeys).where(eq(journeys.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function bulkJourneysAction(ids: number[], action: "verify" | "review" | "delete"): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  if (!ids.length) return { error: "Aucun trajet sélectionné." };
  if (action === "delete") {
    await db.delete(schedules).where(inArray(schedules.journeyId, ids));
    await db.delete(journeys).where(inArray(journeys.id, ids));
  } else if (action === "review") {
    await db.update(journeys).set({ verificationStatus: "needs_review", updatedAt: new Date() }).where(inArray(journeys.id, ids));
  } else {
    // Ne jamais valider automatiquement une donnée incomplète : départ + source requis.
    const res = await db
      .update(journeys)
      .set({ verificationStatus: "verified", problem: null, updatedAt: new Date() })
      .where(and(inArray(journeys.id, ids), sql`${journeys.departureTime} is not null`, sql`(${journeys.source} is not null or ${journeys.sourceUrl} is not null)`))
      .returning({ id: journeys.id });
    revalidatePath("/admin", "layout");
    const skipped = ids.length - res.length;
    return skipped > 0
      ? { ok: true, error: `${res.length} trajet(s) vérifié(s). ${skipped} ignoré(s) : heure de départ ou source manquante.` }
      : { ok: true };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setJourneyStatusAction(id: number, status: "verified" | "needs_review" | "rejected" | "unverified"): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  if (status === "verified") {
    const [j] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1);
    if (!j?.departureTime) return { error: "Impossible de vérifier : heure de départ manquante." };
    if (!j.source && !j.sourceUrl) return { error: "Impossible de vérifier : source manquante." };
  }
  await db.update(journeys).set({ verificationStatus: status, updatedAt: new Date(), ...(status === "verified" ? { problem: null } : {}) }).where(eq(journeys.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function resolveReportAction(id: number, status: "resolved" | "dismissed"): Promise<AdminResult> {
  const g = await guard();
  if (g) return g;
  await db.update(reports).set({ status }).where(eq(reports.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- CSV import ----------
export type ImportType = "companies" | "cities" | "journeys";
export type ImportIssue = { row: number; level: "error" | "warning"; message: string };
export type ImportCheck = { ok: boolean; total: number; valid: number; issues: ImportIssue[]; error?: string };

const REQUIRED: Record<ImportType, string[]> = {
  companies: ["company_name"],
  cities: ["city_name"],
  journeys: ["company_name", "departure_city", "arrival_city"],
};

async function analyse(type: ImportType, rows: Record<string, string>[]) {
  const issues: ImportIssue[] = [];
  const good: Record<string, string>[] = [];
  const seen = new Set<string>();
  const [cs, cos] = await Promise.all([db.select().from(cities), db.select().from(companies)]);
  const cityByName = new Map(cs.map((c) => [normalizeText(c.name), c]));
  const coByName = new Map(cos.map((c) => [normalizeText(c.name), c]));
  rows.forEach((r, idx) => {
    const n = idx + 2; // ligne CSV (en-tête = 1)
    let bad = false;
    for (const f of REQUIRED[type]) {
      if (!r[f]?.trim()) {
        issues.push({ row: n, level: "error", message: `Champ obligatoire manquant : ${f}` });
        bad = true;
      }
    }
    if (bad) return;
    if (type === "companies") {
      const k = normalizeText(r.company_name);
      if (coByName.has(k)) issues.push({ row: n, level: "warning", message: `Doublon : « ${r.company_name} » existe déjà (ligne ignorée).` }), (bad = true);
      else if (seen.has(k)) issues.push({ row: n, level: "warning", message: `Doublon dans le fichier : « ${r.company_name} » (ignorée).` }), (bad = true);
      seen.add(k);
      if (!bad && r.website && !/^https?:\/\//.test(r.website)) issues.push({ row: n, level: "warning", message: "Site web sans http(s):// (conservé tel quel)." });
      if (!bad && !r.phone) issues.push({ row: n, level: "warning", message: "Téléphone non renseigné." });
    } else if (type === "cities") {
      const k = normalizeText(r.city_name);
      if (cityByName.has(k)) issues.push({ row: n, level: "warning", message: `Doublon : « ${r.city_name} » existe déjà (ignorée).` }), (bad = true);
      else if (seen.has(k)) issues.push({ row: n, level: "warning", message: `Doublon dans le fichier : « ${r.city_name} » (ignorée).` }), (bad = true);
      seen.add(k);
      if (!bad && !r.region) issues.push({ row: n, level: "warning", message: "Région non renseignée." });
    } else {
      if (!coByName.has(normalizeText(r.company_name))) issues.push({ row: n, level: "error", message: `Compagnie inconnue : « ${r.company_name} ». Importez-la d'abord.` }), (bad = true);
      if (!cityByName.has(normalizeText(r.departure_city))) issues.push({ row: n, level: "error", message: `Ville de départ inconnue : « ${r.departure_city} ».` }), (bad = true);
      if (!cityByName.has(normalizeText(r.arrival_city))) issues.push({ row: n, level: "error", message: `Ville d'arrivée inconnue : « ${r.arrival_city} ».` }), (bad = true);
      if (!bad && normalizeText(r.departure_city) === normalizeText(r.arrival_city)) issues.push({ row: n, level: "error", message: "Départ et arrivée identiques." }), (bad = true);
      if (r.departure_time && !timeRe.test(r.departure_time.trim())) issues.push({ row: n, level: "error", message: `Heure de départ invalide : « ${r.departure_time} » (HH:MM).` }), (bad = true);
      if (r.arrival_time && !timeRe.test(r.arrival_time.trim())) issues.push({ row: n, level: "error", message: `Heure d'arrivée invalide : « ${r.arrival_time} » (HH:MM).` }), (bad = true);
      if (r.price && !(Number(r.price.replace(",", ".")) > 0)) issues.push({ row: n, level: "error", message: `Prix invalide : « ${r.price} ».` }), (bad = true);
      if (!bad) {
        const k = [r.company_name, r.departure_city, r.arrival_city, r.departure_time].map((x) => normalizeText(x ?? "")).join("|");
        if (seen.has(k)) issues.push({ row: n, level: "warning", message: "Doublon dans le fichier (ignorée)." }), (bad = true);
        seen.add(k);
      }
      if (!bad && !r.departure_time) issues.push({ row: n, level: "warning", message: "Heure de départ manquante : le trajet sera « À vérifier »." });
      if (!bad && !r.arrival_time) issues.push({ row: n, level: "warning", message: "Heure d'arrivée manquante." });
    }
    if (!bad) good.push(r);
  });
  return { issues, good, cityByName, coByName };
}

export async function validateImportAction(type: ImportType, rows: Record<string, string>[]): Promise<ImportCheck> {
  const g = await guard();
  if (g) return { ok: false, total: rows.length, valid: 0, issues: [], error: g.error };
  const a = await analyse(type, rows);
  return { ok: true, total: rows.length, valid: a.good.length, issues: a.issues };
}

export async function importAction(type: ImportType, rows: Record<string, string>[]): Promise<{ ok: boolean; inserted: number; skipped: number; error?: string }> {
  const g = await guard();
  if (g) return { ok: false, inserted: 0, skipped: rows.length, error: g.error };
  const a = await analyse(type, rows);
  let inserted = 0;
  if (type === "companies") {
    for (const r of a.good) {
      await db.insert(companies).values({
        name: r.company_name.trim(),
        slug: slugify(r.company_name),
        phone: clean(r.phone),
        website: clean(r.website),
        description: clean(r.description),
        source: clean(r.source) ?? "Import CSV",
        status: "needs_review",
      }).onConflictDoNothing();
      inserted++;
    }
  } else if (type === "cities") {
    for (const r of a.good) {
      await db.insert(cities).values({
        name: r.city_name.trim(),
        slug: slugify(r.city_name),
        region: clean(r.region),
        country: clean(r.country) ?? "Maroc",
        status: "needs_review",
      }).onConflictDoNothing();
      inserted++;
    }
  } else {
    for (const r of a.good) {
      const co = a.coByName.get(normalizeText(r.company_name))!;
      const dep = a.cityByName.get(normalizeText(r.departure_city))!;
      const arr = a.cityByName.get(normalizeText(r.arrival_city))!;
      const routeId = await ensureRoute(co.id, dep.id, arr.id);
      await db.insert(journeys).values({
        companyId: co.id,
        routeId,
        departureCityId: dep.id,
        arrivalCityId: arr.id,
        departureTime: clean(r.departure_time),
        arrivalTime: clean(r.arrival_time),
        durationMinutes: r.travel_duration && Number(r.travel_duration) > 0 ? Math.round(Number(r.travel_duration)) : null,
        price: r.price ? String(Number(r.price.replace(",", "."))) : null,
        sourceUrl: clean(r.source_url),
        source: clean(r.source) ?? "Import CSV",
        // Un import n'est jamais « vérifié » automatiquement.
        verificationStatus: r.departure_time && r.arrival_time ? "unverified" : "needs_review",
        problem: !r.departure_time ? "Heure de départ manquante" : !r.arrival_time ? "Heure d'arrivée manquante" : null,
      });
      inserted++;
    }
  }
  revalidatePath("/admin", "layout");
  return { ok: true, inserted, skipped: rows.length - inserted };
}
