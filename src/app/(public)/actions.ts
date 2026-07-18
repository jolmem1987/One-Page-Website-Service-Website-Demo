"use server";

import { headers } from "next/headers";
import { createLead } from "@/lib/leads";
import type { LeadFormState } from "./lead-form-state";

/**
 * Server action backing the public estimate form. Progressive-enhancement
 * friendly: works without client JS, and returns typed state for useActionState.
 */
export async function submitLeadAction(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  const userAgent = h.get("user-agent") ?? "";

  const raw = Object.fromEntries(formData.entries());
  const result = await createLead(raw, { ip, userAgent });

  if (!result.ok) {
    return { status: "error", message: result.error, fieldErrors: result.fieldErrors };
  }

  if (result.savedToDb === false) {
    // Accepted but not persisted (no DB) — be honest rather than pretend.
    return {
      status: "success-nodb",
      message:
        "Thanks! Your request was received. (Note: this preview isn't connected to a database yet, " +
        "so it wasn't stored. Connect a database to capture leads.)",
    };
  }

  return {
    status: "success",
    message: "Thanks! Your request has been received. We'll be in touch shortly.",
  };
}
