/**
 * Minimal BM25 ranking — the whole search engine, in one file, no dependencies.
 *
 *   score(D,Q) = Σ_term IDF(term) · (f · (k1+1)) / (f + k1 · (1 − b + b·|D|/avgdl))
 *
 * The index is a handful of plain objects, so it is cheap to rebuild on every
 * request (the site has tens of content chunks, not thousands).
 */
import type { Bm25Data } from "./types";
import { tokenize } from "./tokenizer";

const K1 = 1.5;
const B = 0.75;

export function buildBm25(docs: { id: string; text: string }[]): Bm25Data {
  const docLen: Record<string, number> = {};
  const df: Record<string, number> = {};
  const postings: Record<string, Record<string, number>> = {};
  let totalLen = 0;

  for (const doc of docs) {
    const terms = tokenize(doc.text);
    docLen[doc.id] = terms.length;
    totalLen += terms.length;

    const seen = new Set<string>();
    for (const term of terms) {
      const post = (postings[term] ??= {});
      post[doc.id] = (post[doc.id] ?? 0) + 1;
      if (!seen.has(term)) {
        df[term] = (df[term] ?? 0) + 1;
        seen.add(term);
      }
    }
  }

  const n = docs.length;
  return { n, avgdl: n > 0 ? totalLen / n : 0, docLen, df, postings, k1: K1, b: B };
}

/** Top-k document ids with their BM25 scores. */
export function searchBm25(
  data: Bm25Data,
  query: string,
  k = 8,
): { id: string; score: number }[] {
  const { n, avgdl, docLen, df, postings, k1, b } = data;
  if (n === 0) return [];

  const scores = new Map<string, number>();

  for (const term of tokenize(query)) {
    const post = postings[term];
    if (!post) continue;
    const termDf = df[term] ?? 0;
    // Smoothed IDF, always non-negative.
    const idf = Math.log(1 + (n - termDf + 0.5) / (termDf + 0.5));

    for (const docId of Object.keys(post)) {
      const f = post[docId] ?? 0;
      const dl = docLen[docId] ?? 0;
      const denom = f + k1 * (1 - b + (b * dl) / (avgdl || 1));
      scores.set(docId, (scores.get(docId) ?? 0) + idf * ((f * (k1 + 1)) / (denom || 1)));
    }
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, z) => z.score - a.score)
    .slice(0, k);
}
