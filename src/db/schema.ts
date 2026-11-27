import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  numeric,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // user | admin
  language: text("language").notNull().default("fr"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  phone: text("phone"),
  website: text("website"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  description: text("description"),
  notes: text("notes"),
  source: text("source"),
  status: text("status").notNull().default("needs_review"), // verified | unverified | needs_review
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  region: text("region"),
  country: text("country").notNull().default("Maroc"),
  category: text("category"), // plages | montagnes | desert | historique | nature | culture
  description: text("description"),
  highlights: text("highlights"), // separated with "|"
  imageUrl: text("image_url"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  featured: integer("featured").notNull().default(0),
  status: text("status").notNull().default("verified"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  departureCityId: integer("departure_city_id").notNull(),
  arrivalCityId: integer("arrival_city_id").notNull(),
});

export const routeStops = pgTable("route_stops", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull(),
  stopCityId: integer("stop_city_id").notNull(),
  stopOrder: integer("stop_order").notNull(),
});

export const journeys = pgTable("journeys", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  routeId: integer("route_id"),
  departureCityId: integer("departure_city_id").notNull(),
  arrivalCityId: integer("arrival_city_id").notNull(),
  departureTime: text("departure_time"), // HH:MM
  arrivalTime: text("arrival_time"), // HH:MM
  durationMinutes: integer("duration_minutes"),
  price: numeric("price", { precision: 8, scale: 2 }),
  travelDate: text("travel_date"),
  verificationStatus: text("verification_status").notNull().default("unverified"), // verified | unverified | needs_review | rejected
  sourceUrl: text("source_url"),
  source: text("source"),
  problem: text("problem"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  journeyId: integer("journey_id").notNull(),
  operatingDays: text("operating_days"),
  scheduleDetails: text("schedule_details"),
});

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    itemType: text("item_type").notNull(), // journey | city | company
    itemId: integer("item_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("favorites_unique").on(t.userId, t.itemType, t.itemId)]
);

export const recentSearches = pgTable("recent_searches", {
  id: serial("id").primaryKey(),
  ownerKey: text("owner_key").notNull(), // "u:ID" or "v:visitorId"
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  travelDate: text("travel_date"),
  passengers: integer("passengers").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("report"), // report | feedback
  journeyId: integer("journey_id"),
  route: text("route"),
  companyName: text("company_name"),
  issueType: text("issue_type"),
  description: text("description").notNull(),
  email: text("email"),
  status: text("status").notNull().default("pending"), // pending | resolved | dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
