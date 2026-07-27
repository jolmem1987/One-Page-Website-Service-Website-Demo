/**
 * The assistant's entry point: one message in, one grounded reply out.
 *
 *   getSiteConfig()  →  buildKnowledgeBase()  →  retrieve()  →  classifyIntent()
 *                                                          →  respond()
 *
 * The knowledge base is rebuilt from the live site config on each request. That
 * keeps the bot exactly in sync with what the pages show (including admin
 * edits) and costs well under a millisecond at this content size.
 */
import { getSiteConfig } from "../data";
import { buildKnowledgeBase } from "./knowledge";
import { classifyIntent, INTENT_KINDS } from "./intents";
import { generateGroundedReply } from "./llm";
import { retrieve } from "./retrieve";
import { respond } from "./respond";
import type { ChatRequest, ChatResponse, KnowledgeBase } from "./types";

export type { ChatRequest, ChatResponse } from "./types";

/** Builds the knowledge base from the site's current content. */
export async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  return buildKnowledgeBase(await getSiteConfig());
}

export async function answerVisitorMessage(req: ChatRequest): Promise<ChatResponse> {
  const kb = await loadKnowledgeBase();
  const message = (req.message ?? "").trim();

  if (!message) {
    return respond({ intent: "greeting", hits: [], kb });
  }

  // Keyword rules pick the intent; the intent's preferred content kinds then
  // bias which part of the site the answer is drawn from.
  const intent = classifyIntent(message);
  const hits = retrieve(kb, message, {
    page: req.page,
    boostKinds: INTENT_KINDS[intent],
  });

  const rules = respond({ intent, hits, kb });

  const generated = await generateGroundedReply({
    kb,
    message,
    hits,
    history: req.history,
  });

  return generated ? { ...rules, text: generated, mode: "ai" } : rules;
}

/** The opening message, so the widget can render it without a round trip. */
export async function chatGreeting(): Promise<{
  businessName: string;
  greeting: string;
  suggestions: string[];
}> {
  const kb = await loadKnowledgeBase();
  const opener = respond({ intent: "greeting", hits: [], kb });
  return {
    businessName: kb.persona.businessName,
    greeting: opener.text,
    suggestions: opener.suggestions,
  };
}
