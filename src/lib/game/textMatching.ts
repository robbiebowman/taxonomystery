// Normalize text by removing articles and extra whitespace
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, '') // Remove articles
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Levenshtein distance function
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Check if guess is close enough to target
export function isCloseMatch(guess: string, target: string): boolean {
  const normalizedGuess = normalizeText(guess)
  const normalizedTarget = normalizeText(target)
  
  // Exact match after normalization
  if (normalizedGuess === normalizedTarget) return true
  
  // Levenshtein distance within 20% of target length
  const distance = levenshteinDistance(normalizedGuess, normalizedTarget)
  const maxDistance = Math.floor(normalizedTarget.length * 0.2)
  
  return distance <= maxDistance
}

// Validate guess against article titles and aliases
export function validateGuess(guess: string, title: string, aliases: string[]): boolean {
  const targets = [title, ...aliases]
  return targets.some(target => isCloseMatch(guess, target))
}