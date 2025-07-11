// LocalStorage utilities for persisting user puzzle scores in browser

export interface StoredAnswer {
  guess: string
  correct: boolean
  article_title: string
}

export interface StoredScore {
  date: string
  score: number
  totalQuestions: number
  completedAt: string // ISO date string
  answers: StoredAnswer[]
  isCompleted: boolean // Whether the puzzle was fully completed
  currentQuestionIndex: number // Track progress through the puzzle
}

export interface UserStats {
  totalPuzzlesCompleted: number
  totalScore: number
  averageScore: number
  bestScore: number
  bestScoreDate: string
}

const STORAGE_KEY = 'taxonomy_mystery_scores'

// Check if localStorage is available (SSR safe)
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const test = 'localStorage_test'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Get all stored scores
export function getAllStoredScores(): Record<string, StoredScore> {
  if (!isLocalStorageAvailable()) return {}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const scores = stored ? JSON.parse(stored) : {}
    
    // Migrate legacy scores that don't have the new fields
    let needsMigration = false
    for (const score of Object.values(scores)) {
      const s = score as StoredScore & { isCompleted?: boolean; currentQuestionIndex?: number }
      if (typeof s.isCompleted === 'undefined') {
        s.isCompleted = true // Assume legacy scores were completed
        s.currentQuestionIndex = s.totalQuestions - 1
        needsMigration = true
      }
    }
    
    // Save migrated data back to localStorage
    if (needsMigration) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
    }
    
    return scores
  } catch (error) {
    console.warn('Failed to parse stored scores:', error)
    return {}
  }
}

// Get score for a specific date
export function getStoredScore(date: string): StoredScore | null {
  const scores = getAllStoredScores()
  return scores[date] || null
}

// Save score for a specific date
export function saveScore(scoreData: StoredScore): boolean {
  if (!isLocalStorageAvailable()) return false
  
  try {
    const scores = getAllStoredScores()
    scores[scoreData.date] = scoreData
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
    return true
  } catch (error) {
    console.warn('Failed to save score:', error)
    return false
  }
}

// Check if user has attempted a puzzle
export function hasAttemptedPuzzle(date: string): boolean {
  return getStoredScore(date) !== null
}

// Check if user has completed a puzzle (vs just attempted)
export function hasCompletedPuzzle(date: string): boolean {
  const score = getStoredScore(date)
  return score !== null && score.isCompleted
}

// Check if user has a partial attempt at a puzzle
export function hasPartialAttempt(date: string): boolean {
  const score = getStoredScore(date)
  return score !== null && !score.isCompleted
}

// Save partial progress (called after each answer)
export function savePartialProgress(scoreData: Omit<StoredScore, 'isCompleted'> & { isCompleted?: boolean }): boolean {
  if (!isLocalStorageAvailable()) return false
  
  try {
    const scores = getAllStoredScores()
    const partialScore: StoredScore = {
      ...scoreData,
      isCompleted: scoreData.isCompleted ?? false
    }
    scores[scoreData.date] = partialScore
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
    return true
  } catch (error) {
    console.warn('Failed to save partial progress:', error)
    return false
  }
}

// Get user statistics
export function getUserStats(): UserStats {
  const scores = getAllStoredScores()
  const scoreValues = Object.values(scores)
  
  // Only count completed puzzles for statistics
  const completedScores = scoreValues.filter(score => score.isCompleted)
  
  if (completedScores.length === 0) {
    return {
      totalPuzzlesCompleted: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      bestScoreDate: ''
    }
  }
  
  const totalScore = completedScores.reduce((sum, score) => sum + score.score, 0)
  const totalQuestions = completedScores.reduce((sum, score) => sum + score.totalQuestions, 0)
  
  // Find best score (highest percentage)
  const bestScoreData = completedScores.reduce((best, current) => {
    const currentPercentage = current.score / current.totalQuestions
    const bestPercentage = best.score / best.totalQuestions
    return currentPercentage > bestPercentage ? current : best
  })
  
  return {
    totalPuzzlesCompleted: completedScores.length,
    totalScore,
    averageScore: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
    bestScore: bestScoreData.score,
    bestScoreDate: bestScoreData.date
  }
}

// Get completed puzzle dates (for filtering)
export function getCompletedPuzzleDates(): string[] {
  const scores = getAllStoredScores()
  return Object.keys(scores).sort((a, b) => b.localeCompare(a)) // Sort newest first
}

// Clear all stored scores (for testing/debugging)
export function clearAllScores(): boolean {
  if (!isLocalStorageAvailable()) return false
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.warn('Failed to clear scores:', error)
    return false
  }
}

// Export scores as JSON (for backup)
export function exportScores(): string | null {
  const scores = getAllStoredScores()
  try {
    return JSON.stringify(scores, null, 2)
  } catch (error) {
    console.warn('Failed to export scores:', error)
    return null
  }
}

// Import scores from JSON (for restore)
export function importScores(jsonData: string): boolean {
  if (!isLocalStorageAvailable()) return false
  
  try {
    const scores = JSON.parse(jsonData)
    
    // Validate the data structure
    if (typeof scores !== 'object' || scores === null) {
      throw new Error('Invalid scores data format')
    }
    
    // Basic validation of score objects
    for (const [date, score] of Object.entries(scores)) {
      if (!isValidStoredScore(score as StoredScore)) {
        throw new Error(`Invalid score data for date ${date}`)
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
    return true
  } catch (error) {
    console.warn('Failed to import scores:', error)
    return false
  }
}

// Validate stored score object structure
function isValidStoredScore(score: unknown): score is StoredScore {
  const s = score as StoredScore
  return (
    typeof score === 'object' &&
    score !== null &&
    typeof s.date === 'string' &&
    typeof s.score === 'number' &&
    typeof s.totalQuestions === 'number' &&
    typeof s.completedAt === 'string' &&
    Array.isArray(s.answers) &&
    typeof s.isCompleted === 'boolean' &&
    typeof s.currentQuestionIndex === 'number'
  )
}