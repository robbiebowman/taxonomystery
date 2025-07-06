import { createClient } from '@supabase/supabase-js'
import { Article } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class ArticlesRepository {
  async getRandomUnusedArticles(count: number): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('used_count', { ascending: true })
      .order('RANDOM()')
      .limit(count)
    
    if (error) {
      throw new Error(`Failed to fetch random articles: ${error.message}`)
    }
    
    return data || []
  }

  async incrementUsageCount(articleIds: number[]): Promise<void> {
    const { error } = await supabase.rpc('increment_usage_count', {
      article_ids: articleIds
    })
    
    if (error) {
      throw new Error(`Failed to increment usage count: ${error.message}`)
    }
  }

  async createBulk(articles: Omit<Article, 'id' | 'used_count' | 'created_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .insert(articles)
    
    if (error) {
      throw new Error(`Failed to create articles: ${error.message}`)
    }
  }
}