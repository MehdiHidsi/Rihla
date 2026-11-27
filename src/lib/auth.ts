import { cookies } from "next/headers";
import { cache } from "react";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";

export { hashPassword, verifyPassword } from "@/lib/auth-hash";

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.insert(sessions).values({ token, userId, expiresAt });
  (await cookies()).set("rihla_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get("rihla_session")?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  jar.delete("rihla_session");
}

export type CurrentUser = { id: number; name: string; email: string; role: string; language: string; createdAt: Date };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get("rihla_session")?.value;
  if (!token) return null;
  await ensureSeed();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      language: users.language,
      createdAt: users.createdAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.token, token))
    .limit(1);
  const r = rows[0];
  if (!r || r.expiresAt < new Date()) return null;
  return { id: r.id, name: r.name, email: r.email, role: r.role, language: r.language, createdAt: r.createdAt };
});

export async function requireAdmin() {
  const u = await getCurrentUser();
  return u && u.role === "admin" ? u : null;
}

export async function getOwnerKey(): Promise<string | null> {
  const u = await getCurrentUser();
  if (u) return `u:${u.id}`;
  const vid = (await cookies()).get("rihla_vid")?.value;
  return vid ? `v:${vid}` : null;
}
