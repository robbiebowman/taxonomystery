  CREATE OR REPLACE FUNCTION get_random_unused_articles(
    article_count INTEGER DEFAULT 10
  )
  RETURNS TABLE(
    id INTEGER,
    title TEXT,
    wikipedia_url TEXT,
    used_count INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT a.id, a.title, a.wikipedia_url, a.used_count, a.created_at
    FROM articles a
    ORDER BY RANDOM()
    LIMIT article_count;
  END;
  $$ LANGUAGE plpgsql;