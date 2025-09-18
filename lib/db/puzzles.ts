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
      if (error.code === '23505') {
        throw new Error(`Puzzle already exists for date ${puzzle.date}`);
      }

      // Since we're removing the articles column, fallback method should fail gracefully
      console.log('⚠️  New function not available. Migration required:', error.message);

      const legacyInsert = await supabase
        .from('daily_puzzles')
        .insert({
          date: puzzle.date,
          articles: puzzle.articles
        })
        .select('id, date, created_at, articles')
        .single();

      if (!legacyInsert.error && legacyInsert.data) {
        return {
          id: legacyInsert.data.id,
          date: legacyInsert.data.date,
          created_at: legacyInsert.data.created_at,
          articles: legacyInsert.data.articles || []
        };
      }

      if (legacyInsert.error?.code === '42703') {
        // Legacy column removed – fall back to manual inserts into normalized tables
        const normalizedInsert = await supabase
          .from('daily_puzzles')
          .insert({
            date: puzzle.date,
            article_count: puzzle.articles.length
          })
          .select('id, date, created_at')
          .single();

        if (normalizedInsert.error || !normalizedInsert.data) {
          throw new Error(`Failed to create puzzle: ${normalizedInsert.error?.message ?? 'Unknown error'}`);
        }

        if (puzzle.articles.length > 0) {
          const { error: articleInsertError } = await supabase
            .from('puzzle_articles')
            .insert(
              puzzle.articles.map(article => ({
                puzzle_id: normalizedInsert.data!.id,
                article_id: article.article_id,
                title: article.title,
                categories: article.categories,
                aliases: article.aliases,
                snippet: article.snippet ?? null,
                image_url: article.image_url ?? null
              }))
            );

          if (articleInsertError) {
            throw new Error(`Failed to create puzzle articles: ${articleInsertError.message}`);
          }
        }

        return {
          id: normalizedInsert.data.id,
          date: normalizedInsert.data.date,
          created_at: normalizedInsert.data.created_at,
          articles: puzzle.articles
        };
      }

      if (legacyInsert.error) {
        throw new Error(`Failed to create puzzle: ${legacyInsert.error.message}`);
      }
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
    }

    if (!normalizedError && normalizedData && normalizedData.length > 0) {
      return normalizedData[0];
    }

    // For environments without the normalized structure, fall back to legacy JSON storage
    const { data: legacyPuzzle, error: legacyError } = await supabase
      .from('daily_puzzles')
      .select('id, date, article_count, created_at, articles')
      .eq('date', date)
      .single();

    if (legacyError) {
      if (legacyError.code === '42703') {
        // Column "articles" does not exist – retry without it and stitch via puzzle_articles table
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

        const { data: puzzleArticles, error: puzzleArticlesError } = await supabase
          .from('puzzle_articles')
          .select('article_id, title, categories, aliases, snippet, image_url')
          .eq('puzzle_id', basicPuzzle.id)
          .order('id', { ascending: true });

        if (puzzleArticlesError) {
          throw new Error(`Failed to fetch puzzle articles: ${puzzleArticlesError.message}`);
        }

        return {
          id: basicPuzzle.id,
          date: basicPuzzle.date,
          created_at: basicPuzzle.created_at,
          articles: puzzleArticles || []
        };
      }

      if (legacyError.code === 'PGRST116') {
        return null; // Puzzle doesn't exist
      }

      throw new Error(`Failed to fetch puzzle: ${legacyError.message}`);
    }

    if (!legacyPuzzle) {
      return null;
    }

    if (legacyPuzzle.articles && Array.isArray(legacyPuzzle.articles)) {
      return {
        id: legacyPuzzle.id,
        date: legacyPuzzle.date,
        created_at: legacyPuzzle.created_at,
        articles: legacyPuzzle.articles
      };
    }

    // If the JSON column is absent but the query succeeded, assemble articles from normalized table
    const { data: fallbackArticles, error: fallbackArticlesError } = await supabase
      .from('puzzle_articles')
      .select('article_id, title, categories, aliases, snippet, image_url')
      .eq('puzzle_id', legacyPuzzle.id)
      .order('id', { ascending: true });

    if (fallbackArticlesError) {
      throw new Error(`Failed to fetch puzzle articles: ${fallbackArticlesError.message}`);
    }

    return {
      id: legacyPuzzle.id,
      date: legacyPuzzle.date,
      created_at: legacyPuzzle.created_at,
      articles: fallbackArticles || []
    };
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
