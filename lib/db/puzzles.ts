import { createClient } from '@supabase/supabase-js'
import { DailyPuzzle, CreatePuzzleData } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class PuzzlesRepository {
  async create(puzzle: CreatePuzzleData): Promise<DailyPuzzle> {
    // Try using the new normalized structure with SQL function
    const { error } = await supabase.rpc('create_puzzle_with_articles', {
      puzzle_date: puzzle.date,
      puzzle_articles_data: puzzle.articles
    });
    
    if (error) {
      // Since we're removing the articles column, fallback method should fail gracefully
      console.log('⚠️  New function not available. Migration required.');
      throw new Error('Normalized structure not available. Please apply the latest migration.');
    }
    
    // If the function succeeded, get the created puzzle
    const createdPuzzle = await this.getByDate(puzzle.date);
    if (!createdPuzzle) {
      throw new Error('Failed to retrieve created puzzle');
    }
    
    return createdPuzzle;
  }

  async getByDate(date: string): Promise<DailyPuzzle | null> {
    // Try using the new normalized structure function first
    const { data: normalizedData, error: normalizedError } = await supabase.rpc('get_puzzle_with_articles', {
      puzzle_date: date
    });
    
    if (normalizedError) {
      console.log('⚠️  Get function error:', normalizedError.message);
      // For now, let's check if puzzle exists without the function
      const { data: basicPuzzle, error: basicError } = await supabase
        .from('daily_puzzles')
        .select('id, date, article_count, created_at')
        .eq('date', date)
        .single();
        
      if (basicError) {
        if (basicError.code === 'PGRST116') {
          return null; // Puzzle doesn't exist
        }
        throw new Error(`Failed to fetch puzzle: ${basicError.message}`);
      }
      
      // Get articles separately 
      const { data: articles, error: articlesError } = await supabase
        .from('puzzle_articles')
        .select('article_id, title, categories, aliases')
        .eq('puzzle_id', basicPuzzle.id);
        
      if (articlesError) {
        throw new Error(`Failed to fetch puzzle articles: ${articlesError.message}`);
      }
      
      return {
        id: basicPuzzle.id,
        date: basicPuzzle.date,
        created_at: basicPuzzle.created_at,
        articles: articles
      };
    }
    
    if (normalizedData && normalizedData.length > 0) {
      return normalizedData[0];
    }
    
    return null;
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

  async getAllDates(): Promise<string[]> {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('date')
      .order('date', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch puzzle dates: ${error.message}`)
    }
    
    return data.map(row => row.date)
  }

  async list(): Promise<{ date: string; article_count: number; created_at: string }[]> {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('date, article_count, created_at')
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch puzzle list: ${error.message}`)
    }

    return data || []
  }
}