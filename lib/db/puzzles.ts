import { createClient } from '@supabase/supabase-js'
import { DailyPuzzle, CreatePuzzleData } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class PuzzlesRepository {
  async create(puzzle: CreatePuzzleData): Promise<DailyPuzzle> {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .insert({
        date: puzzle.date,
        articles: puzzle.articles
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create puzzle: ${error.message}`)
    }
    
    return data
  }

  async getByDate(date: string): Promise<DailyPuzzle | null> {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('date', date)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch puzzle: ${error.message}`)
    }
    
    return data
  }

  async exists(date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('id')
      .eq('date', date)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return false
      }
      throw new Error(`Failed to check puzzle existence: ${error.message}`)
    }
    
    return !!data
  }
}