-- Normalize puzzle articles structure to avoid JSONB size limits
-- Creates separate table for puzzle articles to store unlimited categories and aliases

-- Create puzzle_articles table for normalized storage
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

-- Add article_count column to daily_puzzles for tracking
ALTER TABLE daily_puzzles ADD COLUMN article_count INTEGER DEFAULT 0;

-- Drop the problematic JSONB index that was causing size limit errors
DROP INDEX IF EXISTS idx_daily_puzzles_articles;

-- Function to get puzzle with articles from normalized structure
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

-- Function to create puzzle with normalized articles
CREATE OR REPLACE FUNCTION create_puzzle_with_articles(
  puzzle_date DATE,
  puzzle_articles_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  new_puzzle_id INTEGER;
  article_item JSONB;
BEGIN
  -- Insert the puzzle with article count
  INSERT INTO daily_puzzles (date, article_count)
  VALUES (puzzle_date, jsonb_array_length(puzzle_articles_data))
  RETURNING id INTO new_puzzle_id;
  
  -- Insert each article into normalized table
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