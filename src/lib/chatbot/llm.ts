/**
 * OPTIONAL grounded-AI upgrade.
 *
 * Off by default — the assistant works with zero API keys and zero per-message
 * cost. When `CHATBOT_AI=true` and `OPENAI_API_KEY` are both set on this
 * project, the *retrieval* stays exactly the same and only the wording of the
 * reply is generated, strictly from the retrieved site copy. The CTA, the
 * suggestion chips, and the source links still come from the rules engine.
 *
 * Any failure (bad key, rate limit, timeout, refusal) falls back to the rules
 * reply, so the bot never goes dark. The key is read server-side only.
 */
import type { ChatTurn, KnowledgeBase, RetrievalHit } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const TIMEOUT_MS = 8000;

export function aiEnabled(): boolean {
  return process.env.CHATBOT_AI === "true" && Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Rewrites the answer using only the retrieved context. Returns null when AI is
 * off or anything goes wrong — callers then use the rules reply.
 */
export async function generateGroundedReply(args: {
  kb: KnowledgeBase;
  message: string;
  hits: RetrievalHit[];
  history?: ChatTurn[];
}): Promise<string | null> {
  const { kb, message, hits, history } = args;
  if (!aiEnabled() || hits.length === 0) return null;

  const p = kb.persona;
  const context = hits
    .slice(0, 5)
    .map((h) => `### ${h.chunk.title}\n${h.chunk.answer}`)
    .join("\n\n");

  const system = [
    `You are the website assistant for ${p.businessName}, a local service business in ${p.primaryCity}, ${p.state}.`,
    `Answer ONLY using the CONTEXT below, which is this business's own published website copy.`,
    `If the answer is not in the CONTEXT, say you don't have that detail and point the visitor to ${p.phone} or the free estimate request. Never invent prices, timelines, credentials, or services.`,
    `Be warm and plain-spoken. Two to four sentences, no headings, no markdown links.`,
    p.isDemo
      ? `This is a demonstration site for a fictional business; never claim otherwise if asked.`
      : "",
    process.env.CHATBOT_AI_PROMPT ?? "",
    `\nCONTEXT:\n${context}`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system" as const, content: system },
    ...(history ?? []).slice(-4).map((t) => ({
      role: t.role === "user" ? ("user" as const) : ("assistant" as const),
      content: t.text,
    })),
    { role: "user" as const, content: message },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const baseUrl = process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL;
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.CHATBOT_AI_MODEL || DEFAULT_MODEL,
        temperature: 0.3,
        max_tokens: 300,
        messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`OpenAI responded ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.warn("[chatbot] AI reply failed, using rules engine:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
