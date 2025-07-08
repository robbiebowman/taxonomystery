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
      .limit(count * 3) // Get more results to randomize from
    
    if (error) {
      throw new Error(`Failed to fetch random articles: ${error.message}`)
    }
    
    // Shuffle and limit on the client side
    const shuffled = (data || []).sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  async incrementUsageCount(articleIds: number[]): Promise<void> {
    // Try using the SQL function first
    const { error: rpcError } = await supabase.rpc('increment_usage_count', {
      article_ids: articleIds
    })
    
    if (!rpcError) {
      return; // Function worked
    }
    
    // Fallback: Get current counts and update
    console.log('⚠️  SQL function not available, using fallback method...');
    
    // Get current articles
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, used_count')
      .in('id', articleIds);
      
    if (fetchError) {
      throw new Error(`Failed to fetch current usage counts: ${fetchError.message}`);
    }
    
    // Update each article
    for (const article of articles || []) {
      const { error } = await supabase
        .from('articles')
        .update({ used_count: article.used_count + 1 })
        .eq('id', article.id);
        
      if (error) {
        throw new Error(`Failed to increment usage count for article ${article.id}: ${error.message}`);
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