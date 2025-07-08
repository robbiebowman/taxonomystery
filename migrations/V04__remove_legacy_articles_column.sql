-- Remove legacy articles JSONB column from daily_puzzles
-- Complete migration to normalized structure

-- Make articles column nullable first to avoid constraint violations
ALTER TABLE daily_puzzles ALTER COLUMN articles DROP NOT NULL;

-- Drop the articles column entirely - we now use the normalized puzzle_articles table
ALTER TABLE daily_puzzles DROP COLUMN IF EXISTS articles;

-- Update create function to work without articles column
CREATE OR REPLACE FUNCTION create_puzzle_with_articles(
  puzzle_date DATE,
  puzzle_articles_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  new_puzzle_id INTEGER;
  article_item JSONB;
BEGIN
  -- Insert the puzzle without articles column
  INSERT INTO daily_puzzles (date, article_count)
  VALUES (puzzle_date, jsonb_array_length(puzzle_articles_data))
  RETURNING id INTO new_puzzle_id;
  
  -- Insert each article into the normalized table
  FOR article_item IN SELECT * FROM jsonb_array_elements(puzzle_articles_data)
  LOOP
    INSERT INTO puzzle_articles (
      puzzle_id,
      article_id,
      title,
      categories,
      aliases
    ) VALUES (
      new_puzzle_id,
      (article_item->>'article_id')::INTEGER,
      article_item->>'title',
      COALESCE(article_item->'categories', '[]'::jsonb),
      COALESCE(article_item->'aliases', '[]'::jsonb)
    );
  END LOOP;
  
  RETURN new_puzzle_id;
END;
$$ LANGUAGE plpgsql;

-- Update get function with correct structure
CREATE OR REPLACE FUNCTION get_puzzle_with_articles(puzzle_date DATE)
RETURNS TABLE(
  id INTEGER,
  date DATE,
  article_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  articles JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dp.date::DATE,
    dp.article_count,
    dp.created_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'article_id', pa.article_id,
            'title', pa.title,
            'categories', pa.categories,
            'aliases', pa.aliases
          )
        )
        FROM puzzle_articles pa 
        WHERE pa.puzzle_id = dp.id
      ),
      '[]'::jsonb
    ) as articles
  FROM daily_puzzles dp
  WHERE dp.date = puzzle_date;
END;
$$ LANGUAGE plpgsql;