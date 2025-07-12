-- Add snippet and image_url columns to puzzle_articles table
ALTER TABLE puzzle_articles 
ADD COLUMN snippet TEXT,
ADD COLUMN image_url TEXT;

-- Update the get_puzzle_with_articles function to include the new fields
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
            'aliases', pa.aliases,
            'snippet', pa.snippet,
            'image_url', pa.image_url
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

-- Update the create_puzzle_with_articles function to handle the new fields
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