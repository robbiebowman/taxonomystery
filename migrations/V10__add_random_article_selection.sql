-- Add function to efficiently select random totally unused articles
-- Uses a scalable approach with offset-based randomization

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
DECLARE
  total_count INTEGER;
  random_offset INTEGER;
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.wikipedia_url, a.used_count, a.created_at
  FROM articles a
  ORDER BY RANDOM()  -- Shuffle the result
  LIMIT article_count;
END;
$$ LANGUAGE plpgsql;