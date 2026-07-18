import { NextResponse, type NextRequest } from "next/server";
import { createLead } from "@/lib/leads";

export const runtime = "nodejs";

/**
 * Alternative JSON/form endpoint for the estimate form. The site primarily uses
 * a server action, but this route lets external integrations or a no-JS
 * fallback submit leads too. Same validation, honeypot, and rate limiting apply.
 */
export async function POST(req: NextRequest) {
  let raw: Record<string, unknown> = {};
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      raw = (await req.json()) as Record<string, unknown>;
    } else {
      const form = await req.formData();
      raw = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const userAgent = req.headers.get("user-agent") ?? "";

  const result = await createLead(raw, { ip, userAgent });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, fieldErrors: result.fieldErrors },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, savedToDb: result.savedToDb ?? false });
}
