import { createClient } from '@supabase/supabase-js'
import { UserScore, SubmitScoreData, ScoreDistribution } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class ScoresRepository {
  async submitScore(data: SubmitScoreData): Promise<UserScore> {
    const { data: result, error } = await supabase
      .from('user_scores')
      .upsert({
        user_id: data.user_id,
        puzzle_date: data.puzzle_date,
        score: data.score,
        answers: data.answers
      }, {
        onConflict: 'user_id,puzzle_date'
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to submit score: ${error.message}`)
    }
    
    return result
  }

  async getUserHistory(userId: string): Promise<UserScore[]> {
    const { data, error } = await supabase
      .from('user_scores')
      .select('*')
      .eq('user_id', userId)
      .order('puzzle_date', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch user history: ${error.message}`)
    }
    
    return data || []
  }

  async getDistribution(date: string): Promise<ScoreDistribution[]> {
    const { data, error } = await supabase
      .from('score_distributions')
      .select('*')
      .eq('puzzle_date', date)
      .order('score', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to fetch score distribution: ${error.message}`)
    }
    
    return data || []
  }

  async updateDistribution(date: string, score: number): Promise<void> {
    const { error } = await supabase.rpc('upsert_score_distribution', {
      p_date: date,
      p_score: score
    })
    
    if (error) {
      throw new Error(`Failed to update score distribution: ${error.message}`)
    }
  }
}