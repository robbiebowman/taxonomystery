import { createClient } from '@supabase/supabase-js'
import { Article } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class ArticlesRepository {
  async getRandomUnusedArticles(count: number): Promise<Article[]> {
    // Use database function for efficient random selection of totally unused articles
    const { data, error } = await supabase.rpc('get_random_unused_articles', {
      article_count: count
    })
    
    if (error) {
      throw new Error(`Failed to fetch random articles: ${error.message}`)
    }
    
    return data || []
  }

  async incrementUsageCount(articleIds: number[]): Promise<void> {
    // Try using the SQL function first
    await supabase.rpc('increment_usage_count', {
      article_ids: articleIds
    })
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