export interface Article {
  id: number
  title: string
  wikipedia_url: string
  used_count: number
  created_at: Date
}

export interface DailyPuzzle {
  id: number
  date: string
  articles: PuzzleArticle[]
  created_at: Date
}

export interface PuzzleArticle {
  article_id: number
  title: string
  categories: string[]
  aliases: string[]
}

export interface UserScore {
  id: number
  user_id: string
  puzzle_date: string
  score: number
  answers: Answer[]
  completed_at: Date
}

export interface Answer {
  guess: string
  correct: boolean
  article_title: string
}

export interface ScoreDistribution {
  puzzle_date: string
  score: number
  count: number
}

export interface CreatePuzzleData {
  date: string
  articles: PuzzleArticle[]
}

export interface SubmitScoreData {
  user_id: string
  puzzle_date: string
  score: number
  answers: Answer[]
}