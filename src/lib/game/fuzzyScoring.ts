const ARTICLES = new Set<string>(["the", "a", "an"])
const STOPWORDS = new Set<string>(["of", "and", "for", "to", "in", "on", "at", "by", "with", "from"])
const MONARCH_FIRST_NAMES = new Set<string>([
  "henry",
  "louis",
  "edward",
  "philip",
  "charles",
  "john",
  "george",
  "james",
  "william",
  "richard",
  "mary",
  "elizabeth",
  "victoria",
])

const ROMAN_MAP: Record<string, number> = { m: 1000, d: 500, c: 100, l: 50, x: 10, v: 5, i: 1 }

// Number words (1–99) & ordinals
const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
}

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

const ORDINAL_UNITS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  fourteenth: 14,
  fifteenth: 15,
  sixteenth: 16,
  seventeenth: 17,
  eighteenth: 18,
  nineteenth: 19,
}

const ORDINAL_TENS: Record<string, number> = {
  twentieth: 20,
  thirtieth: 30,
  fortieth: 40,
  fiftieth: 50,
  sixtieth: 60,
  seventieth: 70,
  eightieth: 80,
  ninetieth: 90,
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
}

interface NumberPair {
  value: number
  consumed: number
}

export interface NormalizedText {
  normalized: string
  tokenSet: Set<string>
  numericTokens: string[]
  nonNumericTokens: string[]
}

export interface GuardRailResult {
  ok: boolean
  reasons: string[]
  answer: NormalizedText
  guess: NormalizedText
}

export interface FuzzyDecision {
  accepted: boolean
  reason: string
  details:
    | { phase: "alias" }
    | (GuardRailResult & { phase: "guard_rails" })
    | {
        phase: "fuzzy"
        answerNormalized: string
        guessNormalized: string
        jaroWinkler: number
        damerauLevenshtein: number
        tokenJaccard: number
        combinedScore: number
        appliedRule: string
      }
}

function wordsToNumberPair(tokens: string[], index: number): NumberPair | null {
  const token = tokens[index]

  const unit = UNITS[token]
  if (typeof unit === "number") {
    return { value: unit, consumed: 1 }
  }

  const tens = TENS[token]
  if (typeof tens === "number") {
    const next = tokens[index + 1]
    const nextUnit = next ? UNITS[next] : undefined
    if (typeof nextUnit === "number") {
      return { value: tens + nextUnit, consumed: 2 }
    }
    return { value: tens, consumed: 1 }
  }

  const ordUnit = ORDINAL_UNITS[token]
  if (typeof ordUnit === "number") {
    return { value: ordUnit, consumed: 1 }
  }

  const ordTen = ORDINAL_TENS[token]
  if (typeof ordTen === "number") {
    const next = tokens[index + 1]
    const nextOrdUnit = next ? ORDINAL_UNITS[next] : undefined
    if (typeof nextOrdUnit === "number") {
      return { value: ordTen + nextOrdUnit, consumed: 2 }
    }
    return { value: ordTen, consumed: 1 }
  }

  return null
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{Mn}+/gu, "")
}

function romanToIntMaybe(value: string): number | null {
  const roman = value.toLowerCase()
  if (!/^[mdclxvi]+$/.test(roman)) return null

  let total = 0
  let previous = 0
  for (let index = roman.length - 1; index >= 0; index -= 1) {
    const current = ROMAN_MAP[roman[index]]
    if (!current) return null
    total += current < previous ? -current : current
    previous = current
  }
  return total
}

function numberWordToIntMaybe(token: string): number | null {
  return NUMBER_WORDS[token] ?? null
}

export function preprocessNumberWords(raw: string): string {
  const cleaned = stripDiacritics(raw.toLowerCase().trim())
    .replace(/[’'`]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[-_:.,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const tokens = cleaned.split(" ")
  const output: string[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    const pair = wordsToNumberPair(tokens, index)
    if (pair) {
      output.push(String(pair.value))
      index += pair.consumed - 1
    } else {
      output.push(tokens[index])
    }
  }

  return output.join(" ")
}

export function normalizeText(raw: string, dropArticles = true): NormalizedText {
  let normalized = stripDiacritics(raw.toLowerCase().trim())
  normalized = normalized.replace(/&/g, " and ")
  normalized = normalized.replace(/[’'`]/g, "")
  normalized = normalized.replace(/[()]/g, " ")
  normalized = normalized.replace(/[-_:.,/]/g, " ")
  normalized = normalized.replace(/\s+/g, " ").trim()

  const tokens = normalized.split(" ")
  const resultTokens: string[] = []
  const numericTokens: string[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token) continue
    if (dropArticles && ARTICLES.has(token)) continue

    const pair = wordsToNumberPair(tokens, index)
    if (pair) {
      const tag = `num_${pair.value}`
      resultTokens.push(tag)
      numericTokens.push(tag)
      index += pair.consumed - 1
      continue
    }

    const ordinalMatch = token.match(/^(\d+)(st|nd|rd|th)$/)
    if (ordinalMatch) {
      const tag = `num_${parseInt(ordinalMatch[1], 10)}`
      resultTokens.push(tag)
      numericTokens.push(tag)
      continue
    }

    if (/^\d+$/.test(token)) {
      const tag = `num_${parseInt(token, 10)}`
      resultTokens.push(tag)
      numericTokens.push(tag)
      continue
    }

    const romanValue = romanToIntMaybe(token)
    if (romanValue !== null) {
      const tag = `num_${romanValue}`
      resultTokens.push(tag)
      numericTokens.push(tag)
      continue
    }

    const numberWord = numberWordToIntMaybe(token)
    if (numberWord !== null) {
      const tag = `num_${numberWord}`
      resultTokens.push(tag)
      numericTokens.push(tag)
      continue
    }

    resultTokens.push(token)
  }

  const filteredTokens = resultTokens.filter(token => !STOPWORDS.has(token))

  return {
    normalized: resultTokens.join(" "),
    tokenSet: new Set(filteredTokens),
    numericTokens,
    nonNumericTokens: resultTokens.filter(token => !token.startsWith("num_") && !STOPWORDS.has(token)),
  }
}

function jaroWinkler(left: string, right: string): number {
  if (left === right) return 1

  const leftLength = left.length
  const rightLength = right.length
  if (leftLength === 0 || rightLength === 0) return 0

  const matchDistance = Math.floor(Math.max(leftLength, rightLength) / 2) - 1
  const leftMatches = new Array<boolean>(leftLength).fill(false)
  const rightMatches = new Array<boolean>(rightLength).fill(false)

  let matches = 0
  for (let i = 0; i < leftLength; i += 1) {
    const start = Math.max(0, i - matchDistance)
    const end = Math.min(i + matchDistance + 1, rightLength)

    for (let j = start; j < end; j += 1) {
      if (rightMatches[j]) continue
      if (left[i] !== right[j]) continue
      leftMatches[i] = true
      rightMatches[j] = true
      matches += 1
      break
    }
  }

  if (matches === 0) return 0

  let transpositions = 0
  let k = 0
  for (let i = 0; i < leftLength; i += 1) {
    if (!leftMatches[i]) continue
    while (!rightMatches[k]) {
      k += 1
    }
    if (left[i] !== right[k]) {
      transpositions += 1
    }
    k += 1
  }

  transpositions /= 2

  const m = matches
  const jaro = (m / leftLength + m / rightLength + (m - transpositions) / m) / 3

  let prefix = 0
  const maxPrefix = 4
  for (let i = 0; i < Math.min(maxPrefix, leftLength, rightLength); i += 1) {
    if (left[i] === right[i]) prefix += 1
    else break
  }

  const scalingFactor = 0.1
  return jaro + prefix * scalingFactor * (1 - jaro)
}

function damerauLevenshtein(left: string, right: string): number {
  const leftLength = left.length
  const rightLength = right.length
  const infinite = leftLength + rightLength

  const da: Record<string, number> = {}
  const score: number[][] = Array.from({ length: leftLength + 2 }, () => new Array<number>(rightLength + 2).fill(0))
  score[0][0] = infinite

  for (let i = 0; i <= leftLength; i += 1) {
    score[i + 1][1] = i
    score[i + 1][0] = infinite
  }

  for (let j = 0; j <= rightLength; j += 1) {
    score[1][j + 1] = j
    score[0][j + 1] = infinite
  }

  for (let i = 1; i <= leftLength; i += 1) {
    let db = 0
    for (let j = 1; j <= rightLength; j += 1) {
      const i1 = da[right[j - 1]] ?? 0
      const j1 = db
      const cost = left[i - 1] === right[j - 1] ? 0 : 1
      if (cost === 0) db = j
      score[i + 1][j + 1] = Math.min(
        score[i][j] + cost,
        score[i + 1][j] + 1,
        score[i][j + 1] + 1,
        score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1)
      )
    }
    da[left[i - 1]] = i
  }

  return score[leftLength + 1][rightLength + 1]
}

function jaccard(setA: Set<string>, setB: Set<string>): number {
  const a = new Set(setA)
  const b = new Set(setB)
  const intersectionSize = [...a].filter(value => b.has(value)).length
  const unionSize = new Set([...a, ...b]).size
  return unionSize === 0 ? 1 : intersectionSize / unionSize
}

function bestTokenSimilarity(aTokens: string[], bTokens: string[]): number {
  let best = 0
  for (const a of aTokens) {
    for (const b of bTokens) {
      best = Math.max(best, jaroWinkler(a, b))
    }
  }
  return best
}

function tokensAsSortedArray(tokens: string[]): string[] {
  return [...tokens].sort()
}

export function applyGuardRails(answerRaw: string, guessRaw: string): GuardRailResult {
  const answer = normalizeText(preprocessNumberWords(answerRaw))
  const guess = normalizeText(preprocessNumberWords(guessRaw))

  const reasons: string[] = []
  let ok = true

  const firstGuessToken = stripDiacritics(guessRaw.toLowerCase().trim()).split(/\s+/)[0] ?? ""
  if (MONARCH_FIRST_NAMES.has(firstGuessToken)) {
    const answerNumbers = new Set(answer.numericTokens)
    const guessNumbers = new Set(guess.numericTokens)
    if (answerNumbers.size || guessNumbers.size) {
      if (JSON.stringify(tokensAsSortedArray([...answerNumbers])) !== JSON.stringify(tokensAsSortedArray([...guessNumbers]))) {
        ok = false
        reasons.push("Monarch numeral mismatch (e.g., VI vs VIII)")
      }
    }
  }

  const answerNumericTokens = new Set(answer.numericTokens)
  const guessNumericTokens = new Set(guess.numericTokens)
  if (answerNumericTokens.size > 0 && guessNumericTokens.size > 0) {
    if (JSON.stringify(tokensAsSortedArray([...answerNumericTokens])) !== JSON.stringify(tokensAsSortedArray([...guessNumericTokens]))) {
      ok = false
      reasons.push("Numeric tokens differ (e.g., 1984 vs 1990)")
    } else {
      const sharedTokens = answer.nonNumericTokens.filter(token => guess.nonNumericTokens.includes(token)).length
      const bestSimilarity = bestTokenSimilarity(answer.nonNumericTokens, guess.nonNumericTokens)
      if (sharedTokens === 0 && bestSimilarity < 0.93) {
        ok = false
        reasons.push("Needs a matching non-numeric term; numeric match alone is insufficient")
      }
    }
  }

  if (answer.nonNumericTokens.length === 1 && answer.numericTokens.length === 1) {
    const bestSimilarity = bestTokenSimilarity(answer.nonNumericTokens, guess.nonNumericTokens)
    if (bestSimilarity < 0.9) {
      ok = false
      reasons.push("Head word too different")
    }
  }

  return { ok, reasons, answer, guess }
}

function normalizedAliasList(aliases: string[]): string[] {
  return aliases.map(alias => normalizeText(preprocessNumberWords(alias)).normalized)
}

export function decideAnswer(answerRaw: string, guessRaw: string, aliases: string[]): FuzzyDecision {
  const preprocessedAnswer = preprocessNumberWords(answerRaw)
  const preprocessedGuess = preprocessNumberWords(guessRaw)

  const guessNormalized = normalizeText(preprocessedGuess)
  const aliasNormalized = normalizedAliasList(aliases)

  if (aliasNormalized.includes(guessNormalized.normalized) || normalizeText(preprocessedAnswer).normalized === guessNormalized.normalized) {
    return { accepted: true, reason: "Exact match after normalization (or alias)", details: { phase: "alias" } }
  }

  const guardRailsResult = applyGuardRails(answerRaw, guessRaw)
  if (!guardRailsResult.ok) {
    return {
      accepted: false,
      reason: guardRailsResult.reasons.join("; "),
      details: {
        phase: "guard_rails",
        ...guardRailsResult,
      },
    }
  }

  const answerNormalized = normalizeText(preprocessedAnswer)
  const jaro = jaroWinkler(answerNormalized.normalized, guessNormalized.normalized)
  const distance = damerauLevenshtein(answerNormalized.normalized, guessNormalized.normalized)
  const tokenSimilarity = jaccard(answerNormalized.tokenSet, guessNormalized.tokenSet)
  const combinedScore = 0.6 * jaro + 0.4 * tokenSimilarity

  const longestLength = Math.max(answerNormalized.normalized.length, guessNormalized.normalized.length)
  const jaroThreshold = longestLength <= 10 ? 0.93 : 0.89

  let accepted = false
  let appliedRule = ""

  if (longestLength <= 5) {
    accepted = (distance <= 1 && tokenSimilarity >= 0.85) || jaro >= 0.95
    appliedRule = "short-title rule"
  } else if (longestLength <= 10) {
    accepted = jaro >= 0.91 || distance <= 2 || combinedScore >= 0.91
    appliedRule = "mid-length rule"
  } else {
    accepted = jaro >= jaroThreshold || combinedScore >= 0.89
    appliedRule = "long-title rule"
  }

  return {
    accepted,
    reason: accepted ? `Fuzzy match passed (${appliedRule})` : "Fuzzy similarity below threshold",
    details: {
      phase: "fuzzy",
      answerNormalized: answerNormalized.normalized,
      guessNormalized: guessNormalized.normalized,
      jaroWinkler: jaro,
      damerauLevenshtein: distance,
      tokenJaccard: tokenSimilarity,
      combinedScore,
      appliedRule,
    },
  }
}

