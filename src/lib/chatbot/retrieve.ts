/**
 * Retrieval over the site knowledge base: BM25, plus two cheap biases that
 * matter a lot in practice —
 *   1. the intent's preferred content kinds (a pricing question should favour
 *      the pricing FAQ over a project write-up that happens to say "cost"), and
 *   2. the page the visitor is currently reading.
 */
import { searchBm25 } from "./bm25";
import type { ChunkKind, KnowledgeBase, PageContext, RetrievalHit } from "./types";

export interface RetrieveOptions {
  k?: number;
  /** Content kinds to favour, in order of preference. */
  boostKinds?: ChunkKind[];
  page?: PageContext;
}

const KIND_BOOST = 1.6;
const PAGE_BOOST = 1.15;

/**
 * BM25 scores grow with query length, so these are deliberately two loose tiers
 * rather than one precise cutoff:
 *
 *  - MIN_CONFIDENT_SCORE — enough to show the match, hedged as "the closest
 *    thing I found". A one-word question ("gutters") lands here legitimately.
 *  - MIN_STRONG_SCORE — required before answering a question where a tangential
 *    match would read as a commitment (pricing, timelines). Below it, the bot
 *    says the detail isn't published and hands off.
 */
export const MIN_CONFIDENT_SCORE = 2.5;
export const MIN_STRONG_SCORE = 7;

export function retrieve(
  kb: KnowledgeBase,
  query: string,
  opts: RetrieveOptions = {},
): RetrievalHit[] {
  const { k = 5, boostKinds, page } = opts;
  const raw = searchBm25(kb.bm25, query, Math.max(k * 3, 15));
  const currentPath = normalizePath(page?.path);

  const hits: RetrievalHit[] = [];
  for (const { id, score } of raw) {
    const chunk = kb.byId[id];
    if (!chunk) continue;
    let s = score;
    if (boostKinds?.includes(chunk.kind)) s *= KIND_BOOST;
    if (currentPath && normalizePath(chunk.href) === currentPath) s *= PAGE_BOOST;
    hits.push({ chunk, score: s });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, k);
}

/** The best hit, or undefined when nothing matched confidently enough. */
export function confidentTop(hits: RetrievalHit[]): RetrievalHit | undefined {
  const top = hits[0];
  return top && top.score >= MIN_CONFIDENT_SCORE ? top : undefined;
}

/** The best hit, but only when the match is unambiguous. */
export function strongTop(hits: RetrievalHit[]): RetrievalHit | undefined {
  const top = hits[0];
  return top && top.score >= MIN_STRONG_SCORE ? top : undefined;
}

/** First hit of a given kind, regardless of overall ranking. */
export function firstOfKind(hits: RetrievalHit[], kind: ChunkKind): RetrievalHit | undefined {
  return hits.find((h) => h.chunk.kind === kind);
}

function normalizePath(href?: string): string | undefined {
  if (!href) return undefined;
  const path = href.split("#")[0] ?? "";
  const trimmed = path.replace(/\/+$/, "");
  return (trimmed || "/").toLowerCase();
}
