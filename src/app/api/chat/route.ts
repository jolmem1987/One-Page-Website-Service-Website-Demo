import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { answerVisitorMessage } from "@/lib/chatbot";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// The knowledge base is derived from live site content, so responses must not
// be cached at the edge.
export const dynamic = "force-dynamic";

const MAX_MESSAGE_CHARS = 500;

const chatSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  page: z
    .object({
      path: z.string().max(300).optional(),
      title: z.string().max(300).optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "bot"]),
        text: z.string().max(MAX_MESSAGE_CHARS * 4),
      }),
    )
    .max(10)
    .optional(),
});

/**
 * The site's own chat endpoint. Same-origin only — the widget on these pages is
 * the only client. Answers are composed from this site's published content
 * (see `lib/chatbot/knowledge.ts`), not from an external service.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const limit = rateLimit(`chat:${ip}`, 30, 5 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "You're sending messages a bit quickly — give it a moment." },
      { status: 429, headers: { "retry-after": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }
  if (Math.random() < 0.02) pruneRateLimits();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please send a shorter message (under 500 characters)." },
      { status: 422 },
    );
  }

  try {
    const reply = await answerVisitorMessage(parsed.data);
    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("[chat] Failed to answer message:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong on our end. Please try again." },
      { status: 500 },
    );
  }
}
