/**
 * Lightweight fuzzy matching for kiosk search.
 * Tolerates typos, soft speech misrecognitions, and partial words.
 */

/** Levenshtein edit distance (small strings only). */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ");

/**
 * Score a candidate against a query.
 * Higher is better. 0 means no match.
 */
export function fuzzyScore(query: string, candidate: string): number {
  const q = norm(query);
  const c = norm(candidate);
  if (!q) return 0;
  if (c === q) return 1000;
  if (c.startsWith(q)) return 900 - (c.length - q.length);
  if (c.includes(q)) return 800 - (c.length - q.length);

  // Token-level: any token that starts with / contains the query
  const tokens = c.split(" ");
  for (const t of tokens) {
    if (t === q) return 850;
    if (t.startsWith(q)) return 750 - (t.length - q.length);
  }

  // Per-token edit distance (tolerate soft speech / typos)
  const maxEdits = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
  let bestTokenDist = Infinity;
  for (const t of tokens) {
    if (Math.abs(t.length - q.length) > maxEdits) continue;
    const d = editDistance(q, t);
    if (d < bestTokenDist) bestTokenDist = d;
  }
  if (bestTokenDist <= maxEdits) return 600 - bestTokenDist * 50;

  // Whole-string edit distance as last resort
  const whole = editDistance(q, c);
  if (whole <= maxEdits + 1) return 400 - whole * 30;

  return 0;
}

export interface FuzzySearchResult<T> {
  item: T;
  score: number;
}

/**
 * Search items across multiple text fields. Returns sorted matches.
 * If query is empty, returns all items in original order with score 0.
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => string[]
): FuzzySearchResult<T>[] {
  const q = query.trim();
  if (!q) return items.map((item) => ({ item, score: 0 }));

  const scored: FuzzySearchResult<T>[] = [];
  for (const item of items) {
    const fields = getFields(item);
    let best = 0;
    for (const f of fields) {
      const s = fuzzyScore(q, f);
      if (s > best) best = s;
    }
    if (best > 0) scored.push({ item, score: best });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Map a fuzzyScore() value to a coarse strength bucket for UI badges.
 * Tiers align with the score ranges produced by fuzzyScore():
 *   exact / token-exact: ≥ 850   → "best"
 *   prefix / contains:   ≥ 700   → "strong"
 *   small edit-distance: ≥ 500   → "close"
 *   anything else > 0:           → "fuzzy"
 */
export type MatchStrength = "best" | "strong" | "close" | "fuzzy";
export function scoreToStrength(score: number): MatchStrength | undefined {
  if (score <= 0) return undefined;
  if (score >= 850) return "best";
  if (score >= 700) return "strong";
  if (score >= 500) return "close";
  return "fuzzy";
}
