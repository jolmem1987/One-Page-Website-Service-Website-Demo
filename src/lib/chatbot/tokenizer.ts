/**
 * Dependency-free tokenizer shared by indexing and querying.
 *
 * Deterministic and entirely local — no NLP service, no model.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "so", "of", "to", "in",
  "on", "for", "with", "at", "by", "from", "up", "about", "into", "over",
  "after", "is", "are", "was", "were", "be", "been", "being", "am", "do",
  "does", "did", "have", "has", "had", "i", "you", "he", "she", "it", "we",
  "they", "me", "my", "your", "this", "that", "these", "those", "as", "can",
  "will", "just", "not", "no", "yes",
]);

/** Light stemmer: lowercases and strips a few common English suffixes. */
export function stem(token: string): string {
  let t = token;
  if (t.length > 4 && t.endsWith("ing")) t = t.slice(0, -3);
  else if (t.length > 4 && t.endsWith("ies")) t = t.slice(0, -3) + "y";
  else if (t.length > 3 && t.endsWith("es")) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
  return t;
}

/** Splits text into normalized, stemmed terms with stopwords removed. */
export function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const out: string[] = [];
  for (const w of raw) {
    if (STOPWORDS.has(w)) continue;
    if (w.length === 1 && !/[0-9]/.test(w)) continue;
    out.push(stem(w));
  }
  return out;
}
