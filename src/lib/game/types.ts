export interface PuzzleArticle {
  article_id: number
  title: string
  categories: string[]
  aliases: string[]
  snippet?: string
  image_url?: string
}

export interface Puzzle {
  id: number
  date: string
  articles: PuzzleArticle[]
  created_at: string
}

export interface ArticleState {
  article: PuzzleArticle
  userGuess: string
  isRevealed: boolean
  wasCorrect: boolean
}