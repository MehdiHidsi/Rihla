import { and, asc, desc, eq, inArray, sql, count, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  cities,
  companies,
  favorites,
  journeys,
  recentSearches,
  reports,
  routeStops,
  routes,
  schedules,
} from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { normalizeText, timeToMin } from "@/lib/utils";

const dc = alias(cities, "dc");
const ac = alias(cities, "ac");
export const depCity = dc;
export const arrCity = ac;

export type JourneyView = {
  id: number;
  companyId: number;
  companyName: string;
  companyPhone: string | null;
  companyWebsite: string | null;
  routeId: number | null;
  depId: number;
  depName: string;
  depSlug: string;
  arrId: number;
  arrName: string;
  arrSlug: string;
  departureTime: string | null;
  arrivalTime: string | null;
  duration: number | null;
  price: string | null;
  status: string;
  source: string | null;
  sourceUrl: string | null;
  problem: string | null;
  notes: string | null;
  updatedAt: Date;
  stops: string[];
};

const jSel = {
  id: journeys.id,
  companyId: companies.id,
  companyName: companies.name,
  companyPhone: companies.phone,
  companyWebsite: companies.website,
  routeId: journeys.routeId,
  depId: dc.id,
  depName: dc.name,
  depSlug: dc.slug,
  arrId: ac.id,
  arrName: ac.name,
  arrSlug: ac.slug,
  departureTime: journeys.departureTime,
  arrivalTime: journeys.arrivalTime,
  duration: journeys.durationMinutes,
  price: journeys.price,
  status: journeys.verificationStatus,
  source: journeys.source,
  sourceUrl: journeys.sourceUrl,
  problem: journeys.problem,
  notes: journeys.notes,
  updatedAt: journeys.updatedAt,
};

async function stopsFor(routeIds: number[]) {
  const map = new Map<number, string[]>();
  if (!routeIds.length) return map;
  const rows = await db
    .select({ routeId: routeStops.routeId, name: cities.name, order: routeStops.stopOrder })
    .from(routeStops)
    .innerJoin(cities, eq(cities.id, routeStops.stopCityId))
    .where(inArray(routeStops.routeId, routeIds))
    .orderBy(asc(routeStops.stopOrder));
  for (const r of rows) {
    const a = map.get(r.routeId) ?? [];
    a.push(r.name);
    map.set(r.routeId, a);
  }
  return map;
}

export async function queryJourneys(opts: { where?: SQL; order?: SQL[]; limit?: number; offset?: number } = {}) {
  await ensureSeed();
  let q = db
    .select(jSel)
    .from(journeys)
    .innerJoin(companies, eq(companies.id, journeys.companyId))
    .innerJoin(dc, eq(dc.id, journeys.departureCityId))
    .innerJoin(ac, eq(ac.id, journeys.arrivalCityId))
    .$dynamic();
  if (opts.where) q = q.where(opts.where);
  q = q.orderBy(...(opts.order ?? [asc(journeys.departureTime)]));
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.offset) q = q.offset(opts.offset);
  const rows = await q;
  const stops = await stopsFor([...new Set(rows.map((r) => r.routeId).filter((x): x is number => !!x))]);
  return rows.map((r) => ({ ...r, stops: r.routeId ? (stops.get(r.routeId) ?? []) : [] })) as JourneyView[];
}

export async function countJourneys(where?: SQL) {
  await ensureSeed();
  let q = db
    .select({ n: count() })
    .from(journeys)
    .innerJoin(companies, eq(companies.id, journeys.companyId))
    .innerJoin(dc, eq(dc.id, journeys.departureCityId))
    .innerJoin(ac, eq(ac.id, journeys.arrivalCityId))
    .$dynamic();
  if (where) q = q.where(where);
  const [r] = await q;
  return r.n;
}

export async function getJourney(id: number) {
  const [j] = await queryJourneys({ where: eq(journeys.id, id), limit: 1 });
  return j ?? null;
}

export async function getSchedule(journeyId: number) {
  const [s] = await db.select().from(schedules).where(eq(schedules.journeyId, journeyId)).limit(1);
  return s ?? null;
}

// ---------- Cities ----------
export async function allCities() {
  await ensureSeed();
  return db.select().from(cities).orderBy(asc(cities.name));
}

export async function cityBySlug(slug: string) {
  await ensureSeed();
  const [c] = await db.select().from(cities).where(eq(cities.slug, slug)).limit(1);
  return c ?? null;
}

export async function findCityByName(name: string | undefined | null) {
  if (!name) return null;
  const all = await allCities();
  const n = normalizeText(name);
  return all.find((c) => normalizeText(c.name) === n) ?? null;
}

// ---------- Route stats ----------
export async function pairStats() {
  await ensureSeed();
  const rows = await db
    .select({
      dep: journeys.departureCityId,
      arr: journeys.arrivalCityId,
      n: count(),
      companies: sql<number>`count(distinct ${journeys.companyId})`.mapWith(Number),
      minDur: sql<number | null>`min(${journeys.durationMinutes})`,
      firstDep: sql<string | null>`min(${journeys.departureTime})`,
      lastDep: sql<string | null>`max(${journeys.departureTime})`,
    })
    .from(journeys)
    .groupBy(journeys.departureCityId, journeys.arrivalCityId);
  return new Map(rows.map((r) => [`${r.dep}-${r.arr}`, r]));
}

export async function popularRoutes(pairs: [string, string][]) {
  const all = await allCities();
  const stats = await pairStats();
  const by = new Map(all.map((c) => [c.name, c]));
  return pairs.map(([a, b]) => {
    const from = by.get(a)!;
    const to = by.get(b)!;
    return { from, to, stat: stats.get(`${from.id}-${to.id}`) ?? null };
  });
}

// ---------- Companies ----------
export async function companyStatsMap() {
  await ensureSeed();
  const rs = await db
    .select({ companyId: routes.companyId, dep: dc.name, arr: ac.name })
    .from(routes)
    .innerJoin(dc, eq(dc.id, routes.departureCityId))
    .innerJoin(ac, eq(ac.id, routes.arrivalCityId));
  const jc = await db
    .select({ companyId: journeys.companyId, n: count() })
    .from(journeys)
    .groupBy(journeys.companyId);
  const map = new Map<number, { routes: number; cities: string[]; journeys: number }>();
  for (const r of rs) {
    const e = map.get(r.companyId) ?? { routes: 0, cities: [], journeys: 0 };
    e.routes++;
    for (const c of [r.dep, r.arr]) if (!e.cities.includes(c)) e.cities.push(c);
    map.set(r.companyId, e);
  }
  for (const j of jc) {
    const e = map.get(j.companyId) ?? { routes: 0, cities: [], journeys: 0 };
    e.journeys = j.n;
    map.set(j.companyId, e);
  }
  return map;
}

export async function listCompanies() {
  await ensureSeed();
  const rows = await db.select().from(companies).orderBy(asc(companies.name));
  const stats = await companyStatsMap();
  return rows.map((c) => ({ ...c, stats: stats.get(c.id) ?? { routes: 0, cities: [] as string[], journeys: 0 } }));
}

export async function companyById(id: number) {
  await ensureSeed();
  const [c] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return c ?? null;
}

export async function companyPairs(companyId: number) {
  return db
    .select({
      depId: dc.id,
      depName: dc.name,
      depSlug: dc.slug,
      arrId: ac.id,
      arrName: ac.name,
      arrSlug: ac.slug,
      n: count(),
      minDur: sql<number | null>`min(${journeys.durationMinutes})`,
    })
    .from(journeys)
    .innerJoin(dc, eq(dc.id, journeys.departureCityId))
    .innerJoin(ac, eq(ac.id, journeys.arrivalCityId))
    .where(eq(journeys.companyId, companyId))
    .groupBy(dc.id, dc.name, dc.slug, ac.id, ac.name, ac.slug)
    .orderBy(asc(dc.name), asc(ac.name));
}

export async function cityPairs(cityId: number) {
  return db
    .select({
      depId: dc.id,
      depName: dc.name,
      depSlug: dc.slug,
      arrId: ac.id,
      arrName: ac.name,
      arrSlug: ac.slug,
      n: count(),
      minDur: sql<number | null>`min(${journeys.durationMinutes})`,
      companies: sql<string>`string_agg(distinct ${companies.name}, ', ')`,
    })
    .from(journeys)
    .innerJoin(companies, eq(companies.id, journeys.companyId))
    .innerJoin(dc, eq(dc.id, journeys.departureCityId))
    .innerJoin(ac, eq(ac.id, journeys.arrivalCityId))
    .where(sql`${journeys.arrivalCityId} = ${cityId} or ${journeys.departureCityId} = ${cityId}`)
    .groupBy(dc.id, dc.name, dc.slug, ac.id, ac.name, ac.slug)
    .orderBy(desc(count()));
}

export async function companiesForCity(cityId: number) {
  await ensureSeed();
  return db
    .selectDistinct({ id: companies.id, name: companies.name })
    .from(journeys)
    .innerJoin(companies, eq(companies.id, journeys.companyId))
    .where(sql`${journeys.arrivalCityId} = ${cityId} or ${journeys.departureCityId} = ${cityId}`)
    .orderBy(asc(companies.name));
}

// ---------- Search ----------
export type SearchFilters = {
  companies?: number[];
  slots?: string[];
  maxDuration?: number;
  directOnly?: boolean;
  sort?: string;
};

function slotOf(t: string | null) {
  const m = timeToMin(t);
  if (m === null) return null;
  if (m < 300) return "night";
  if (m < 720) return "morning";
  if (m < 1080) return "afternoon";
  return "evening";
}

export async function searchJourneys(fromId: number, toId: number, f: SearchFilters = {}) {
  const conds = [eq(journeys.departureCityId, fromId), eq(journeys.arrivalCityId, toId)];
  if (f.companies?.length) conds.push(inArray(journeys.companyId, f.companies));
  let rows = await queryJourneys({ where: and(...conds), order: [asc(journeys.departureTime)] });
  if (f.slots?.length) rows = rows.filter((r) => (slotOf(r.departureTime) ? f.slots!.includes(slotOf(r.departureTime)!) : false));
  if (f.maxDuration) rows = rows.filter((r) => r.duration !== null && r.duration <= f.maxDuration!);
  if (f.directOnly) rows = rows.filter((r) => r.stops.length === 0);
  const nullLast = (a: number | null, b: number | null) => (a === null ? 1 : b === null ? -1 : a - b);
  if (f.sort === "duration") rows.sort((a, b) => nullLast(a.duration, b.duration));
  else if (f.sort === "arrival") rows.sort((a, b) => nullLast(timeToMin(a.arrivalTime), timeToMin(b.arrivalTime)));
  else if (f.sort === "price") rows.sort((a, b) => nullLast(a.price ? Number(a.price) : null, b.price ? Number(b.price) : null));
  else rows.sort((a, b) => nullLast(timeToMin(a.departureTime), timeToMin(b.departureTime)));
  return rows;
}

export async function hasPrices() {
  const [r] = await db.select({ n: count() }).from(journeys).where(sql`${journeys.price} is not null`);
  return r.n > 0;
}

export async function otherDestinationsFrom(fromId: number) {
  return db
    .select({ id: ac.id, name: ac.name, slug: ac.slug, n: count() })
    .from(journeys)
    .innerJoin(ac, eq(ac.id, journeys.arrivalCityId))
    .where(eq(journeys.departureCityId, fromId))
    .groupBy(ac.id, ac.name, ac.slug)
    .orderBy(desc(count()))
    .limit(6);
}

// ---------- User data ----------
export async function favoriteSet(userId: number) {
  const rows = await db.select().from(favorites).where(eq(favorites.userId, userId));
  return new Set(rows.map((r) => `${r.itemType}:${r.itemId}`));
}

export async function userFavorites(userId: number) {
  const rows = await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  const ids = (t: string) => rows.filter((r) => r.itemType === t).map((r) => r.itemId);
  const jIds = ids("journey");
  const cIds = ids("city");
  const coIds = ids("company");
  const [js, cs, cos, stats] = await Promise.all([
    jIds.length ? queryJourneys({ where: inArray(journeys.id, jIds) }) : Promise.resolve([] as JourneyView[]),
    cIds.length ? db.select().from(cities).where(inArray(cities.id, cIds)) : Promise.resolve([]),
    coIds.length ? db.select().from(companies).where(inArray(companies.id, coIds)) : Promise.resolve([]),
    companyStatsMap(),
  ]);
  return { journeys: js, cities: cs, companies: cos.map((c) => ({ ...c, stats: stats.get(c.id) })) };
}

export async function recentFor(ownerKey: string | null, limit = 8) {
  if (!ownerKey) return [];
  await ensureSeed();
  return db
    .select()
    .from(recentSearches)
    .where(eq(recentSearches.ownerKey, ownerKey))
    .orderBy(desc(recentSearches.createdAt))
    .limit(limit);
}

// ---------- Admin ----------
export async function adminStats() {
  await ensureSeed();
  const one = async (q: Promise<{ n: number }[]>) => (await q)[0].n;
  const [nCompanies, nCities, nRoutes, nJourneys, nReview, nIncomplete, nReports] = await Promise.all([
    one(db.select({ n: count() }).from(companies)),
    one(db.select({ n: count() }).from(cities)),
    one(db.select({ n: count() }).from(routes)),
    one(db.select({ n: count() }).from(journeys)),
    one(db.select({ n: count() }).from(journeys).where(eq(journeys.verificationStatus, "needs_review"))),
    one(db.select({ n: count() }).from(journeys).where(sql`${journeys.arrivalTime} is null or ${journeys.departureTime} is null`)),
    one(db.select({ n: count() }).from(reports).where(eq(reports.status, "pending"))),
  ]);
  const byCity = await db
    .select({ name: dc.name, n: count() })
    .from(journeys)
    .innerJoin(dc, eq(dc.id, journeys.departureCityId))
    .groupBy(dc.name)
    .orderBy(desc(count()))
    .limit(7);
  const byCompany = await db
    .select({ name: companies.name, n: count() })
    .from(routes)
    .innerJoin(companies, eq(companies.id, routes.companyId))
    .groupBy(companies.name)
    .orderBy(desc(count()))
    .limit(6);
  const verif = await db
    .select({ status: journeys.verificationStatus, n: count() })
    .from(journeys)
    .groupBy(journeys.verificationStatus);
  const recentJourneys = await queryJourneys({ order: [desc(journeys.updatedAt)], limit: 5 });
  const recentCompanies = await db.select().from(companies).orderBy(desc(companies.updatedAt)).limit(4);
  const pending = await db.select().from(reports).where(eq(reports.status, "pending")).orderBy(desc(reports.createdAt)).limit(5);
  return { nCompanies, nCities, nRoutes, nJourneys, nReview, nIncomplete, nReports, byCity, byCompany, verif, recentJourneys, recentCompanies, pending };
}

export async function cityStatsMap() {
  await ensureSeed();
  const rows = await db
    .select({ dep: journeys.departureCityId, arr: journeys.arrivalCityId, company: journeys.companyId, n: count() })
    .from(journeys)
    .groupBy(journeys.departureCityId, journeys.arrivalCityId, journeys.companyId);
  const map = new Map<number, { routes: Set<string>; companies: Set<number> }>();
  for (const r of rows) {
    for (const id of [r.dep, r.arr]) {
      const e = map.get(id) ?? { routes: new Set<string>(), companies: new Set<number>() };
      e.routes.add(`${r.dep}-${r.arr}`);
      e.companies.add(r.company);
      map.set(id, e);
    }
  }
  return map;
}

export async function routeStopsFull(routeId: number) {
  return db
    .select({ name: cities.name, order: routeStops.stopOrder, id: cities.id })
    .from(routeStops)
    .innerJoin(cities, eq(cities.id, routeStops.stopCityId))
    .where(eq(routeStops.routeId, routeId))
    .orderBy(asc(routeStops.stopOrder));
}
