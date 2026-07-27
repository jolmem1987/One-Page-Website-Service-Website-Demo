/**
 * Types for the on-site assistant.
 *
 * The bot is a retrieval system, not a generator: every sentence it can say is
 * lifted from this site's own configured content (services, FAQs, process,
 * projects, service area, business details). See `knowledge.ts` for how that
 * content becomes a searchable index.
 */

/** Which part of the site a piece of knowledge came from. */
export type ChunkKind =
  | "overview"
  | "service"
  | "faq"
  | "process"
  | "project"
  | "about"
  | "area"
  | "hours"
  | "contact"
  | "trust"
  | "review";

/** One searchable unit of site content. */
export interface KnowledgeChunk {
  id: string;
  kind: ChunkKind;
  /** Short label, e.g. a service name or an FAQ question. */
  title: string;
  /** Text used for BM25 matching (title + body + helpful synonyms). */
  text: string;
  /**
   * Publish-ready copy the bot is allowed to say verbatim. Always the site's
   * own words — never generated, never paraphrased.
   */
  answer: string;
  /** Where this content lives on the site. */
  href: string;
}

/** Serializable BM25 statistics. */
export interface Bm25Data {
  n: number;
  avgdl: number;
  docLen: Record<string, number>;
  df: Record<string, number>;
  postings: Record<string, Record<string, number>>;
  k1: number;
  b: number;
}

/** Business facts the reply templates are allowed to state directly. */
export interface BotPersona {
  businessName: string;
  greeting: string;
  phone: string;
  telHref: string;
  email: string;
  estimateHref: string;
  galleryHref: string;
  servicesHref: string;
  primaryCity: string;
  state: string;
  serviceNames: string[];
  faqQuestions: string[];
  isDemo: boolean;
}

/** The compiled, queryable view of the site's content. */
export interface KnowledgeBase {
  byId: Record<string, KnowledgeChunk>;
  bm25: Bm25Data;
  persona: BotPersona;
}

export interface RetrievalHit {
  chunk: KnowledgeChunk;
  score: number;
}

export type Intent =
  | "greeting"
  | "estimate_pricing"
  | "services"
  | "service_area"
  | "hours"
  | "contact"
  | "booking"
  | "urgent_damage"
  | "credentials"
  | "timeline"
  | "projects"
  | "about"
  | "smalltalk"
  | "fallback";

export interface ChatTurn {
  role: "user" | "bot";
  text: string;
}

/** Where the visitor is on the site when they ask (used to bias retrieval). */
export interface PageContext {
  path?: string;
  title?: string;
}

export interface ChatRequest {
  message: string;
  page?: PageContext;
  history?: ChatTurn[];
}

export interface ChatCta {
  label: string;
  href: string;
}

export interface ChatResponse {
  text: string;
  intent: Intent;
  /** Quick-reply chips, always drawn from real site content. */
  suggestions: string[];
  cta?: ChatCta;
  /** Site sections the answer came from, so visitors can read the full copy. */
  sources: { title: string; href: string }[];
  /** "rules" (default, no AI) or "ai" when the optional OpenAI path answered. */
  mode: "rules" | "ai";
}
