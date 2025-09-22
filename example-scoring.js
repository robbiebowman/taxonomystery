import React, { useMemo, useState } from "react";

/*
  Fuzzy Answer Judge — Demo
  --------------------------------------
  - Tightened acceptance so numeric overlap alone isn't enough (e.g., Apollo 13 ≠ April 13)
  - Added number/ordinal words (e.g., Henry Five, Henry the Sixth)
*/

const ARTICLES = new Set(["the", "a", "an"]);
const STOPWORDS = new Set(["of", "and", "for", "to", "in", "on", "at", "by", "with", "from"]);
const MONARCH_FIRSTNAMES = new Set([
  "henry","louis","edward","philip","charles","john","george","james","william","richard","mary","elizabeth","victoria"
]);

const ROMAN_MAP: Record<string, number> = { m:1000, d:500, c:100, l:50, x:10, v:5, i:1 };

// Number words (1–99) & ordinals
const UNITS: Record<string, number> = {
  zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
  ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19
};
const TENS: Record<string, number> = {
  twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90
};
const ORD_UNITS: Record<string, number> = {
  first:1, second:2, third:3, fourth:4, fifth:5, sixth:6, seventh:7, eighth:8, ninth:9,
  tenth:10, eleventh:11, twelfth:12, thirteenth:13, fourteenth:14, fifteenth:15, sixteenth:16, seventeenth:17, eighteenth:18, nineteenth:19
};
const ORD_TENS: Record<string, number> = {
  twentieth:20, thirtieth:30, fortieth:40, fiftieth:50, sixtieth:60, seventieth:70, eightieth:80, ninetieth:90
};

function wordsToNumberPair(tokens: string[], i: number): { value: number, consumed: number } | null {
  const t = tokens[i];
  const n1u = UNITS[t];
  if (typeof n1u === "number") return { value: n1u, consumed: 1 };
  const n1t = TENS[t];
  if (typeof n1t === "number") {
    const next = tokens[i+1];
    const n2u = next ? UNITS[next] : undefined;
    if (typeof n2u === "number") return { value: n1t + n2u, consumed: 2 };
    return { value: n1t, consumed: 1 };
  }
  const o1u = ORD_UNITS[t];
  if (typeof o1u === "number") return { value: o1u, consumed: 1 };
  const o1t = ORD_TENS[t];
  if (typeof o1t === "number") {
    const next = tokens[i+1];
    const o2u = next ? ORD_UNITS[next] : undefined;
    if (typeof o2u === "number") return { value: o1t + o2u, consumed: 2 };
    return { value: o1t, consumed: 1 };
  }
  return null;
}

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{Mn}+/gu, "");
}

function romanToIntMaybe(s: string): number | null {
  const r = s.toLowerCase();
  if (!/^[mdclxvi]+$/.test(r)) return null;
  let total = 0, prev = 0;
  for (let i = r.length - 1; i >= 0; i--) {
    const val = ROMAN_MAP[r[i]];
    if (!val) return null;
    total += val < prev ? -val : val;
    prev = val;
  }
  return total;
}

function preprocessNumberWords(raw: string) {
  // Convert number/ordinal words to digits before normalize
  const s = stripDiacritics(raw.toLowerCase().trim())
    .replace(/[’'`]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[-_:.,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const base = s.split(" ");
  const out: string[] = [];
  for (let i = 0; i < base.length; i++) {
    const pair = wordsToNumberPair(base, i);
    if (pair) { out.push(String(pair.value)); i += pair.consumed - 1; }
    else out.push(base[i]);
  }
  return out.join(" ");
}

const NUMBER_WORDS: Record<string, number> = {
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
  eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
  sixteen:16, seventeen:17, eighteen:18, nineteen:19,
  twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90, hundred:100
};

function numberWordToIntMaybe(word: string): number | null {
  return NUMBER_WORDS[word] ?? null;
}

function normalize(raw: string, dropArticles = true) {
  let s = stripDiacritics(raw.toLowerCase().trim());
  s = s.replace(/&/g, " and ");
  s = s.replace(/[’'`]/g, "");
  s = s.replace(/[()]/g, " ");
  s = s.replace(/[-_:.,/]/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  const tokens = s.split(" ");
  const out: string[] = [];
  const numericTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (dropArticles && ARTICLES.has(t)) continue;

    // multi-token number words first
    const pair = wordsToNumberPair(tokens, i);
    if (pair) {
      const tag = `num_${pair.value}`; out.push(tag); numericTokens.push(tag); i += pair.consumed - 1; continue;
    }
    const ord = t.match(/^(\d+)(st|nd|rd|th)$/);
    if (ord) {
      const k = parseInt(ord[1], 10); const tag = `num_${k}`; out.push(tag); numericTokens.push(tag); continue;
    }
    if (/^\d+$/.test(t)) { const tag = `num_${parseInt(t, 10)}`; out.push(tag); numericTokens.push(tag); continue; }
    const r = romanToIntMaybe(t);
    if (r !== null) { const tag = `num_${r}`; out.push(tag); numericTokens.push(tag); continue; }
    const nw = numberWordToIntMaybe(t);
    if (nw !== null) { const tag = `num_${nw}`; out.push(tag); numericTokens.push(tag); continue; }

    out.push(t);
  }
  const normalized = out.join(" ");
  const tokenSet = new Set(out.filter(t => !STOPWORDS.has(t)));
  const nonNumericTokens = out.filter(t => !t.startsWith("num_") && !STOPWORDS.has(t));
  return { normalized, tokenSet, numericTokens, nonNumericTokens };
}

// --- Similarities -----------------------------------------------------------

function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const aLen = a.length, bLen = b.length;
  if (aLen === 0 || bLen === 0) return 0;
  const matchDistance = Math.floor(Math.max(aLen, bLen) / 2) - 1;
  const aMatches = new Array(aLen).fill(false);
  const bMatches = new Array(bLen).fill(false);
  let matches = 0;
  for (let i = 0; i < aLen; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, bLen);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true; bMatches[j] = true; matches++; break;
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0, k = 0;
  for (let i = 0; i < aLen; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;
  const m = matches;
  const jaro = (m / aLen + m / bLen + (m - transpositions) / m) / 3;
  let prefix = 0, maxPrefix = 4;
  for (let i = 0; i < Math.min(maxPrefix, aLen, bLen); i++) { if (a[i] === b[i]) prefix++; else break; }
  const p = 0.1;
  return jaro + prefix * p * (1 - jaro);
}

function damerauLevenshtein(a: string, b: string): number {
  const al = a.length, bl = b.length;
  const INF = al + bl;
  const da: Record<string, number> = {};
  const score: number[][] = Array(al + 2).fill(0).map(() => Array(bl + 2).fill(0));
  score[0][0] = INF;
  for (let i = 0; i <= al; i++) { score[i+1][1] = i; score[i+1][0] = INF; }
  for (let j = 0; j <= bl; j++) { score[1][j+1] = j; score[0][j+1] = INF; }
  for (let i = 1; i <= al; i++) {
    let db = 0;
    for (let j = 1; j <= bl; j++) {
      const i1 = da[b[j-1]] || 0;
      const j1 = db;
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      if (cost === 0) db = j;
      score[i+1][j+1] = Math.min(
        score[i][j] + cost,
        score[i+1][j] + 1,
        score[i][j+1] + 1,
        score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1)
      );
    }
    da[a[i-1]] = i;
  }
  return score[al+1][bl+1];
}

function jaccard(setA: Set<string>, setB: Set<string>): number {
  const a = new Set([...setA]), b = new Set([...setB]);
  const inter = [...a].filter(x => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni === 0 ? 1 : inter / uni;
}

function bestTokenSimilarity(aTokens: string[], bTokens: string[]) {
  let best = 0;
  for (const a of aTokens) for (const b of bTokens) best = Math.max(best, jaroWinkler(a, b));
  return best;
}

// --- Guard rails ------------------------------------------------------------

function guardRails(answerRaw: string, guessRaw: string) {
  const A = normalize(preprocessNumberWords(answerRaw));
  const G = normalize(preprocessNumberWords(guessRaw));
  const reasons: string[] = [];
  let ok = true;

  // Monarch numeral guard
  const firstGuess = stripDiacritics(guessRaw.toLowerCase().trim()).split(/\s+/)[0] || "";
  if (MONARCH_FIRSTNAMES.has(firstGuess)) {
    const aNums = new Set(A.numericTokens);
    const gNums = new Set(G.numericTokens);
    if (aNums.size || gNums.size) {
      if (JSON.stringify([...aNums].sort()) !== JSON.stringify([...gNums].sort())) {
        ok = false; reasons.push("Monarch numeral mismatch (e.g., VI vs VIII)");
      }
    }
  }

  // If both contain numbers: they must match AND we need non-numeric overlap
  const aNumsAll = new Set(A.numericTokens);
  const gNumsAll = new Set(G.numericTokens);
  if (aNumsAll.size > 0 && gNumsAll.size > 0) {
    if (JSON.stringify([...aNumsAll].sort()) !== JSON.stringify([...gNumsAll].sort())) {
      ok = false; reasons.push("Numeric tokens differ (e.g., 1984 vs 1990)");
    } else {
      const shared = A.nonNumericTokens.filter(t => G.nonNumericTokens.includes(t)).length;
      const best = bestTokenSimilarity(A.nonNumericTokens, G.nonNumericTokens);
      if (shared === 0 && best < 0.93) {
        ok = false; reasons.push("Needs a matching non-numeric term; numeric match alone is insufficient");
      }
    }
  }

  // One head word + one number (e.g., Apollo 13) → require head word to be close
  if (A.nonNumericTokens.length === 1 && A.numericTokens.length === 1) {
    const best = bestTokenSimilarity(A.nonNumericTokens, G.nonNumericTokens);
    if (best < 0.90) { ok = false; reasons.push("Head word too different"); }
  }

  return { ok, reasons, A, G };
}

// --- Decision ---------------------------------------------------------------

function decide(answerRaw: string, guessRaw: string, aliasList: string[]) {
  const aPre = preprocessNumberWords(answerRaw);
  const gPre = preprocessNumberWords(guessRaw);

  const { normalized: gNorm, tokenSet: gTok } = normalize(gPre);
  const aliasesNorm = aliasList.map(a => normalize(preprocessNumberWords(a)).normalized);

  // 1) alias exact
  if (aliasesNorm.includes(gNorm) || normalize(aPre).normalized === gNorm) {
    return { accepted: true, reason: "Exact match after normalization (or alias)", details: { phase: "alias" } } as const;
  }

  // 2) guard rails
  const guards = guardRails(answerRaw, guessRaw);
  if (!guards.ok) {
    return { accepted: false, reason: guards.reasons.join("; "), details: { phase: "guard_rails", ...guards } } as const;
  }

  // 3) fuzzy scoring
  const { normalized: aNorm, tokenSet: aTok } = normalize(aPre);
  const jw = jaroWinkler(aNorm, gNorm);
  const ed = damerauLevenshtein(aNorm, gNorm);
  const tok = jaccard(aTok, gTok);
  const score = 0.6 * jw + 0.4 * tok;

  const n = Math.max(aNorm.length, gNorm.length);
  const jwThr = n <= 10 ? 0.93 : 0.89; // slightly tightened

  let accepted = false;
  let why: string[] = [];
  if (n <= 5) { accepted = (ed <= 1 && tok >= 0.85) || jw >= 0.95; why.push("short-title rule"); }
  else if (n <= 10) { accepted = jw >= 0.91 || ed <= 2 || score >= 0.91; why.push("mid-length rule"); }
  else { accepted = jw >= jwThr || score >= 0.89; why.push("long-title rule"); }

  return {
    accepted,
    reason: accepted ? `Fuzzy match passed (${why.join(", ")})` : "Fuzzy similarity below threshold",
    details: { phase: "fuzzy", aNorm, gNorm, jw, ed, tok, score }
  } as const;
}

// --- UI --------------------------------------------------------------------

export default function App() {
  const [answer, setAnswer] = useState("Henry V");
  const [aliases, setAliases] = useState("King Henry V, Henry 5th, Henry the Fifth");
  const [guess, setGuess] = useState("Henry Five");

  const aliasList = useMemo(() => aliases.split(",").map(s => s.trim()).filter(Boolean), [aliases]);
  const verdict = useMemo(() => decide(answer, guess, aliasList), [answer, guess, aliasList]);
  const normA = useMemo(() => normalize(preprocessNumberWords(answer)), [answer]);
  const normG = useMemo(() => normalize(preprocessNumberWords(guess)), [guess]);

  const badge = verdict.accepted ? "bg-green-600" : "bg-red-600";
  const badgeText = verdict.accepted ? "Accepted" : "Rejected";

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-6">
      <div className="max-w-5xl mx-auto grid gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold">Fuzzy Answer Judge — Demo</h1>
          <span className={`text-white px-3 py-1 rounded-2xl text-sm font-medium ${badge}`}>{badgeText}</span>
        </header>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 grid gap-3">
            <label className="text-sm font-medium">Target answer</label>
            <input value={answer} onChange={e=>setAnswer(e.target.value)} className="w-full border rounded-xl px-3 py-2" placeholder="e.g., Henry V" />

            <label className="text-sm font-medium">Aliases (comma-separated)</label>
            <input value={aliases} onChange={e=>setAliases(e.target.value)} className="w-full border rounded-xl px-3 py-2" placeholder="e.g., King Henry V, Henry the Fifth" />
          </div>

          <div className="bg-white rounded-2xl shadow p-4 grid gap-3">
            <label className="text-sm font-medium">User guess</label>
            <input value={guess} onChange={e=>setGuess(e.target.value)} className="w-full border rounded-xl px-3 py-2" placeholder="Type a guess to test…" />

            <div className="flex flex-wrap gap-2 text-sm">
              <button onClick={()=>{ setAnswer("Henry VI"); setAliases("King Henry VI, Henry 6th, Henry the Sixth"); setGuess("Hrney VI"); }} className="border rounded-xl px-3 py-1 hover:bg-slate-100">Try “Hrney VI”</button>
              <button onClick={()=>{ setAnswer("Henry V"); setAliases("King Henry V, Henry 5th, Henry the Fifth"); setGuess("Henry Five"); }} className="border rounded-xl px-3 py-1 hover:bg-slate-100">Try “Henry Five”</button>
              <button onClick={()=>{ setAnswer("Apollo 13"); setAliases("Apollo Thirteen"); setGuess("April 13"); }} className="border rounded-xl px-3 py-1 hover:bg-slate-100">Try Apollo vs April</button>
              <button onClick={()=>{ setAnswer("Area 51"); setAliases(""); setGuess("Area Fifty One"); }} className="border rounded-xl px-3 py-1 hover:bg-slate-100">Try “Area Fifty One”</button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow p-4 grid gap-4">
          <h2 className="text-lg font-semibold">Decision</h2>
          <p className="text-sm"><span className="font-medium">Result:</span> {badgeText}. {verdict.reason}</p>

          {verdict.details.phase === "guard_rails" && (
            <div className="text-sm">
              <p className="font-medium">Guard rail reasons:</p>
              <ul className="list-disc ml-5">
                {(verdict as any).details.reasons?.map((r: string, i: number)=>(<li key={i}>{r}</li>))}
              </ul>
            </div>
          )}

          {verdict.details.phase === "fuzzy" && (
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-3 border">
                <p className="font-medium mb-2">Normalized strings</p>
                <p><span className="font-medium">Answer:</span> {(verdict as any).details.aNorm}</p>
                <p><span className="font-medium">Guess:</span> {(verdict as any).details.gNorm}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border">
                <p className="font-medium mb-2">Scores</p>
                <p>Jaro-Winkler: {(verdict as any).details.jw.toFixed(4)}</p>
                <p>Damerau-Levenshtein (abs): {(verdict as any).details.ed}</p>
                <p>Token Jaccard: {(verdict as any).details.tok.toFixed(4)}</p>
                <p>Combined score: {(verdict as any).details.score.toFixed(4)}</p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-4 grid gap-4">
          <h2 className="text-lg font-semibold">Debug: Tokens & Numbers</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-3 border">
              <p className="font-medium mb-2">Answer</p>
              <p><span className="font-medium">Normalized:</span> {normA.normalized}</p>
              <p><span className="font-medium">Tokens:</span> {[...normA.tokenSet].join(", ") || "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border">
              <p className="font-medium mb-2">Guess</p>
              <p><span className="font-medium">Normalized:</span> {normG.normalized}</p>
              <p><span className="font-medium">Tokens:</span> {[...normG.tokenSet].join(", ") || "—"}</p>
            </div>
          </div>
        </section>

        <footer className="text-xs text-slate-500 text-center">
          Tweak thresholds in code to fit your dataset. This demo is self-contained — no deps.
        </footer>
      </div>
    </div>
  );
}
