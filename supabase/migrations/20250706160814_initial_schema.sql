-- Create articles table
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  wikipedia_url TEXT NOT NULL,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create daily_puzzles table
CREATE TABLE daily_puzzles (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  articles JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_scores table
CREATE TABLE user_scores (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  puzzle_date DATE NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, puzzle_date)
);

-- Create score_distributions table
CREATE TABLE score_distributions (
  puzzle_date DATE NOT NULL,
  score INTEGER NOT NULL,
  count INTEGER DEFAULT 1,
  PRIMARY KEY (puzzle_date, score)
);

-- Add upsert function for score distributions
CREATE OR REPLACE FUNCTION upsert_score_distribution(p_date DATE, p_score INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO score_distributions (puzzle_date, score, count)
  VALUES (p_date, p_score, 1)
  ON CONFLICT (puzzle_date, score)
  DO UPDATE SET count = score_distributions.count + 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(article_ids INTEGER[])
RETURNS VOID AS $$
BEGIN
  UPDATE articles 
  SET used_count = used_count + 1 
  WHERE id = ANY(article_ids);
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX idx_articles_used_count ON articles(used_count);
CREATE INDEX idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX idx_user_scores_puzzle_date ON user_scores(puzzle_date);
CREATE INDEX idx_score_distributions_puzzle_date ON score_distributions(puzzle_date);