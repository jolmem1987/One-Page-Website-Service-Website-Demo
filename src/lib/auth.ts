import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "./db";
import * as schema from "./db/schema";

/**
 * Lightweight, Vercel-compatible session authentication.
 *
 * - Passwords hashed with bcrypt.
 * - Sessions are opaque random tokens; only the SHA-256 hash is stored in the DB.
 * - The cookie is HttpOnly, SameSite=Lax, and Secure in production.
 * - There is NO public admin registration. Admins are provisioned via the
 *   `admin:create` script or the first-run bootstrap.
 */

const COOKIE_NAME = "cws_session";
const SESSION_TTL_DAYS = 14;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * DEMO MODE — open, read-only admin panel.
 *
 * When DEMO_OPEN_ADMIN="true", visitors can VIEW the admin panel without
 * logging in (allowed by the protected layout), but cannot save any edits
 * (blocked by guard() in admin/actions.ts). A real signed-in admin still gets
 * FULL edit access even while demo mode is on. Remove the flag on a real
 * customer site to require login for viewing as well.
 */
export function isOpenAdminDemo(): boolean {
  return process.env.DEMO_OPEN_ADMIN === "true";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Validates email + password and, on success, creates a session cookie. */
export async function login(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  // Generic error message on purpose — never reveal whether the email exists.
  const GENERIC = "Invalid email or password.";
  if (!db) return { ok: false, error: "Authentication is unavailable until a database is connected." };

  const rows = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email.toLowerCase().trim()))
    .limit(1);
  const user = rows[0];

  // Always run a bcrypt comparison to reduce timing differences.
  const dummyHash = "$2a$12$0000000000000000000000000000000000000000000000000000u";
  const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash);
  if (!user || !valid) return { ok: false, error: GENERIC };

  await createSessionForUser(user.id);
  return { ok: true };
}

export async function createSessionForUser(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(schema.sessions).values({ userId, tokenHash, expiresAt });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Returns the current session user, or null. Safe to call anywhere on the server. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const db = getDb();
  if (!db) return null;

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const rows = await db
    .select({
      userId: schema.adminUsers.id,
      email: schema.adminUsers.email,
      name: schema.adminUsers.name,
    })
    .from(schema.sessions)
    .innerJoin(schema.adminUsers, eq(schema.sessions.userId, schema.adminUsers.id))
    .where(and(eq(schema.sessions.tokenHash, tokenHash), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { id: row.userId, email: row.email, name: row.name };
}

/** Destroys the current session (logout). */
export async function logout(): Promise<void> {
  const db = getDb();
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token && db) {
    await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, hashToken(token)));
  }
  jar.delete(COOKIE_NAME);
}

/**
 * Guard for server components, actions, and route handlers.
 * Returns the user or throws — callers in admin pages should redirect on null.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
