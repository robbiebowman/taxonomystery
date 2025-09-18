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

    if (!error) {
      return data || []
    }

    // Fallback to legacy query when the SQL function is unavailable or outdated
    const { data: legacyData, error: legacyError } = await supabase
      .from('articles')
      .select('id, title, wikipedia_url, used_count, created_at')
      .order('used_count', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(count)

    if (legacyError) {
      throw new Error(`Failed to fetch random articles: ${legacyError.message}`)
    }

    return legacyData || []
  }

  async incrementUsageCount(articleIds: number[]): Promise<void> {
    if (articleIds.length === 0) {
      return
    }

    // Try using the SQL function first
    const { error } = await supabase.rpc('increment_usage_count', {
      article_ids: articleIds
    })

    if (!error) {
      return
    }

    // Fallback for environments without the SQL helper
    const { data, error: fetchError } = await supabase
      .from('articles')
      .select('id, used_count')
      .in('id', articleIds)

    if (fetchError) {
      throw new Error(`Failed to increment article usage: ${fetchError.message}`)
    }

    const updates = data || []

    for (const article of updates) {
      const { error: updateError } = await supabase
        .from('articles')
        .update({ used_count: article.used_count + 1 })
        .eq('id', article.id)

      if (updateError) {
        throw new Error(`Failed to increment article usage: ${updateError.message}`)
      }
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
