"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites, recentSearches, reports, sessions, users } from "@/db/schema";
import {
  createSession,
  destroySession,
  getCurrentUser,
  getOwnerKey,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export type ActionResult = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(input: {
  name: string;
  email: string;
  password: string;
  confirm: string;
  terms: boolean;
}): Promise<ActionResult> {
  await ensureSeed();
  const fe: Record<string, string> = {};
  if (input.name.trim().length < 2) fe.name = "Indiquez votre nom complet.";
  if (!emailRe.test(input.email)) fe.email = "Adresse e-mail invalide.";
  if (input.password.length < 8) fe.password = "Le mot de passe doit contenir au moins 8 caractères.";
  if (input.password !== input.confirm) fe.confirm = "Les mots de passe ne correspondent pas.";
  if (!input.terms) fe.terms = "Vous devez accepter les conditions pour continuer.";
  if (Object.keys(fe).length) return { error: "Veuillez corriger les champs signalés.", fieldErrors: fe };
  const email = input.email.trim().toLowerCase();
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists) return { error: "Un compte existe déjà avec cette adresse e-mail.", fieldErrors: { email: "Adresse déjà utilisée." } };
  const [u] = await db
    .insert(users)
    .values({ name: input.name.trim(), email, passwordHash: hashPassword(input.password) })
    .returning();
  await createSession(u.id);
  redirect("/compte");
}

export async function loginAction(input: { email: string; password: string; next?: string }): Promise<ActionResult> {
  await ensureSeed();
  const email = input.email.trim().toLowerCase();
  if (!emailRe.test(email) || !input.password) {
    return { error: "Saisissez une adresse e-mail et un mot de passe valides.", fieldErrors: { email: !emailRe.test(email) ? "Adresse e-mail invalide." : "" } };
  }
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || !verifyPassword(input.password, u.passwordHash)) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  await createSession(u.id);
  const next = input.next && input.next.startsWith("/") && !input.next.startsWith("//") ? input.next : u.role === "admin" ? "/admin" : "/compte";
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotAction(email: string): Promise<ActionResult> {
  if (!emailRe.test(email.trim())) return { error: "Adresse e-mail invalide.", fieldErrors: { email: "Adresse e-mail invalide." } };
  // L'envoi d'e-mails n'est pas encore branché : réponse neutre pour ne pas révéler l'existence d'un compte.
  return { ok: true };
}

export async function setLangAction(lang: "fr" | "ar") {
  (await cookies()).set("rihla_lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  const u = await getCurrentUser();
  if (u) await db.update(users).set({ language: lang }).where(eq(users.id, u.id));
  revalidatePath("/", "layout");
}

export async function toggleFavoriteAction(type: "journey" | "city" | "company", id: number) {
  const u = await getCurrentUser();
  if (!u) return { needLogin: true as const };
  const where = and(eq(favorites.userId, u.id), eq(favorites.itemType, type), eq(favorites.itemId, id));
  const [ex] = await db.select({ id: favorites.id }).from(favorites).where(where).limit(1);
  if (ex) {
    await db.delete(favorites).where(where);
  } else {
    await db.insert(favorites).values({ userId: u.id, itemType: type, itemId: id }).onConflictDoNothing();
  }
  revalidatePath("/favoris");
  revalidatePath("/compte");
  return { needLogin: false as const, fav: !ex };
}

export async function addRecentAction(input: { origin: string; destination: string; date?: string; pax: number }) {
  const jar = await cookies();
  let key = await getOwnerKey();
  if (!key) {
    const vid = randomBytes(12).toString("hex");
    jar.set("rihla_vid", vid, { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" });
    key = `v:${vid}`;
  }
  await db
    .delete(recentSearches)
    .where(and(eq(recentSearches.ownerKey, key), eq(recentSearches.origin, input.origin), eq(recentSearches.destination, input.destination)));
  await db.insert(recentSearches).values({
    ownerKey: key,
    origin: input.origin,
    destination: input.destination,
    travelDate: input.date || null,
    passengers: Math.min(Math.max(input.pax || 1, 1), 9),
  });
}

export async function deleteRecentAction(id: number) {
  const key = await getOwnerKey();
  if (!key) return;
  await db.delete(recentSearches).where(and(eq(recentSearches.id, id), eq(recentSearches.ownerKey, key)));
  revalidatePath("/", "layout");
}

export async function clearRecentAction() {
  const key = await getOwnerKey();
  if (!key) return;
  await db.delete(recentSearches).where(eq(recentSearches.ownerKey, key));
  revalidatePath("/", "layout");
}

export async function submitReportAction(input: {
  kind: "report" | "feedback";
  journeyId?: number | null;
  route?: string;
  companyName?: string;
  issueType?: string;
  description: string;
  email?: string;
}): Promise<ActionResult> {
  const fe: Record<string, string> = {};
  if (input.kind === "report" && !input.issueType) fe.issueType = "Choisissez un type de problème.";
  if (input.description.trim().length < 10) fe.description = "Décrivez le problème en au moins 10 caractères.";
  if (input.email && !emailRe.test(input.email)) fe.email = "Adresse e-mail invalide.";
  if (Object.keys(fe).length) return { error: "Le formulaire contient des erreurs.", fieldErrors: fe };
  await db.insert(reports).values({
    kind: input.kind,
    journeyId: input.journeyId ?? null,
    route: input.route?.trim() || null,
    companyName: input.companyName?.trim() || null,
    issueType: input.issueType || null,
    description: input.description.trim(),
    email: input.email?.trim() || null,
  });
  return { ok: true };
}

export async function updateProfileAction(input: { name: string; email: string }): Promise<ActionResult> {
  const u = await getCurrentUser();
  if (!u) return { error: "Session expirée. Reconnectez-vous." };
  const fe: Record<string, string> = {};
  if (input.name.trim().length < 2) fe.name = "Indiquez votre nom.";
  if (!emailRe.test(input.email)) fe.email = "Adresse e-mail invalide.";
  if (Object.keys(fe).length) return { error: "Veuillez corriger les champs.", fieldErrors: fe };
  const email = input.email.trim().toLowerCase();
  const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (dup && dup.id !== u.id) return { error: "Cette adresse e-mail est déjà utilisée.", fieldErrors: { email: "Adresse déjà utilisée." } };
  await db.update(users).set({ name: input.name.trim(), email }).where(eq(users.id, u.id));
  revalidatePath("/compte");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePasswordAction(input: { current: string; next: string }): Promise<ActionResult> {
  const u = await getCurrentUser();
  if (!u) return { error: "Session expirée. Reconnectez-vous." };
  const [row] = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  if (!verifyPassword(input.current, row.passwordHash)) return { error: "Mot de passe actuel incorrect.", fieldErrors: { current: "Mot de passe incorrect." } };
  if (input.next.length < 8) return { error: "Le nouveau mot de passe est trop court.", fieldErrors: { next: "Au moins 8 caractères." } };
  await db.update(users).set({ passwordHash: hashPassword(input.next) }).where(eq(users.id, u.id));
  return { ok: true };
}

export async function deleteAccountAction() {
  const u = await getCurrentUser();
  if (!u) return;
  await db.delete(favorites).where(eq(favorites.userId, u.id));
  await db.delete(recentSearches).where(eq(recentSearches.ownerKey, `u:${u.id}`));
  await db.delete(sessions).where(eq(sessions.userId, u.id));
  await db.delete(users).where(eq(users.id, u.id));
  (await cookies()).delete("rihla_session");
  redirect("/");
}
