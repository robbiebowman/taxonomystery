-- Create a separate table for puzzle articles to avoid JSONB size limits
CREATE TABLE puzzle_articles (
  id SERIAL PRIMARY KEY,
  puzzle_id INTEGER NOT NULL REFERENCES daily_puzzles(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles(id),
  title TEXT NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]',
  aliases JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_puzzle_articles_puzzle_id ON puzzle_articles(puzzle_id);
CREATE INDEX idx_puzzle_articles_article_id ON puzzle_articles(article_id);

-- Modify daily_puzzles table to remove the articles JSONB column
-- First, we'll add a new simplified structure
ALTER TABLE daily_puzzles ADD COLUMN article_count INTEGER DEFAULT 0;

-- Drop the problematic index on the articles JSONB column
DROP INDEX IF EXISTS idx_daily_puzzles_articles;

-- We'll keep the articles column for now during migration, but it will be deprecated
-- The new structure will use the puzzle_articles table instead

-- Add a function to get puzzle with articles from the new normalized structure
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
    dp.date,
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

-- Add a function to create puzzle with normalized articles
CREATE OR REPLACE FUNCTION create_puzzle_with_articles(
  puzzle_date DATE,
  puzzle_articles_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  new_puzzle_id INTEGER;
  article_item JSONB;
BEGIN
  -- Insert the puzzle
  INSERT INTO daily_puzzles (date, article_count)
  VALUES (puzzle_date, jsonb_array_length(puzzle_articles_data))
  RETURNING id INTO new_puzzle_id;
  
  -- Insert each article
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