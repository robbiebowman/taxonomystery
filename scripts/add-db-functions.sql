-- Run this SQL in your Supabase SQL Editor to add the missing functions

-- Function to increment article usage counts
CREATE OR REPLACE FUNCTION increment_usage_count(article_ids INTEGER[])
RETURNS VOID AS $$
BEGIN
  UPDATE articles 
  SET used_count = used_count + 1 
  WHERE id = ANY(article_ids);
END;
$$ LANGUAGE plpgsql;

-- Function to upsert score distributions
CREATE OR REPLACE FUNCTION upsert_score_distribution(p_date DATE, p_score INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO score_distributions (puzzle_date, score, count)
  VALUES (p_date, p_score, 1)
  ON CONFLICT (puzzle_date, score)
  DO UPDATE SET count = score_distributions.count + 1;
END;
$$ LANGUAGE plpgsql;