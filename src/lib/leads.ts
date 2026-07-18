import "server-only";
import { createHash } from "node:crypto";
import { getDb } from "./db";
import * as schema from "./db/schema";
import { leadSchema } from "./validation";
import { rateLimit } from "./rate-limit";
import { notifyNewLead } from "./email";

export interface CreateLeadResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** True when the lead was accepted but persistence was skipped (no DB). */
  savedToDb?: boolean;
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.AUTH_SECRET ?? "salt")).digest("hex").slice(0, 32);
}

/**
 * Validates and stores a public lead. Applies honeypot + rate-limiting.
 * Used by both the server action and the /api/leads route so the logic lives
 * in one place.
 */
export async function createLead(
  raw: Record<string, unknown>,
  meta: { ip: string; userAgent: string },
): Promise<CreateLeadResult> {
  // Rate limit: max 5 submissions per 10 minutes per IP.
  const limit = rateLimit(`lead:${hashIp(meta.ip)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return { ok: false, error: "Too many submissions. Please try again in a few minutes." };
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    // Honeypot triggers a generic success-looking failure to avoid tipping off bots.
    const flat = parsed.error.flatten();
    if (flat.fieldErrors.company_website) {
      return { ok: true, savedToDb: false }; // silently drop bot submissions
    }
    const fieldErrors: Record<string, string> = {};
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs && msgs[0]) fieldErrors[key] = msgs[0];
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  const db = getDb();

  // No database configured — accept the submission but say so honestly upstream.
  if (!db) {
    return { ok: true, savedToDb: false };
  }

  try {
    const [lead] = await db
      .insert(schema.leads)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location || null,
        serviceRequested: data.serviceRequested || null,
        preferredContact: data.preferredContact,
        message: data.message || null,
        consent: true,
        source: "website",
        ipHash: hashIp(meta.ip),
        userAgent: meta.userAgent.slice(0, 400),
      })
      .returning({ id: schema.leads.id });

    await db.insert(schema.leadActivities).values({
      leadId: lead.id,
      type: "SYSTEM",
      body: "Lead created from website estimate form.",
    });

    // Best-effort owner notification. Never blocks or fails the submission.
    void notifyNewLead({
      name: data.name,
      email: data.email,
      phone: data.phone,
      service: data.serviceRequested,
      message: data.message,
    }).catch(() => {});

    return { ok: true, savedToDb: true };
  } catch (err) {
    console.error("[leads] Failed to save lead:", err);
    return { ok: false, error: "Something went wrong saving your request. Please call us instead." };
  }
}
