ALTER TABLE daily_puzzles
  ALTER COLUMN articles SET DEFAULT '[]'::jsonb;

-- Align return type with table definition to avoid structure mismatches
DROP FUNCTION IF EXISTS get_random_unused_articles(INTEGER);
CREATE OR REPLACE FUNCTION get_random_unused_articles(
  article_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id INTEGER,
  title TEXT,
  wikipedia_url TEXT,
  used_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.wikipedia_url, a.used_count, a.created_at
  FROM articles a
  ORDER BY a.used_count ASC, RANDOM()
  LIMIT article_count;
END;
$$ LANGUAGE plpgsql;

-- Make sure puzzle creation works whether or not the legacy column is still present
DROP FUNCTION IF EXISTS create_puzzle_with_articles(DATE, JSONB);
CREATE OR REPLACE FUNCTION create_puzzle_with_articles(
  puzzle_date DATE,
  puzzle_articles_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  new_puzzle_id INTEGER;
  article_item JSONB;
BEGIN
  INSERT INTO daily_puzzles (date, article_count, articles)
  VALUES (puzzle_date, jsonb_array_length(puzzle_articles_data), '[]'::jsonb)
  ON CONFLICT (date) DO NOTHING
  RETURNING id INTO new_puzzle_id;

  IF new_puzzle_id IS NULL THEN
    -- Puzzle already exists, bubble up the duplicate error for callers
    RAISE EXCEPTION 'duplicate key value violates unique constraint "daily_puzzles_date_key"'
      USING ERRCODE = '23505';
  END IF;

  DELETE FROM puzzle_articles WHERE puzzle_id = new_puzzle_id;

  FOR article_item IN SELECT * FROM jsonb_array_elements(puzzle_articles_data)
  LOOP
    INSERT INTO puzzle_articles (
      puzzle_id,
      article_id,
      title,
      categories,
      aliases,
      snippet,
      image_url
    ) VALUES (
      new_puzzle_id,
      (article_item->>'article_id')::INTEGER,
      article_item->>'title',
      COALESCE(article_item->'categories', '[]'::jsonb),
      COALESCE(article_item->'aliases', '[]'::jsonb),
      article_item->>'snippet',
      article_item->>'image_url'
    );
  END LOOP;
  
  RETURN new_puzzle_id;
END;
$$ LANGUAGE plpgsql;
