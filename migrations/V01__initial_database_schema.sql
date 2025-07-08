-- Initial TaxonomyMystery Database Schema
-- Based on docs/design_doc.md

-- Articles pool (10,000 pre-loaded articles)
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  wikipedia_url TEXT NOT NULL,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily puzzles (generated via cron)
CREATE TABLE daily_puzzles (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  articles JSONB NOT NULL, -- [{article_id, title, categories[], aliases[]}]
  created_at TIMESTAMP DEFAULT NOW()
);

-- User authentication (handled by Supabase Auth)
-- auth.users table is automatically created

-- User scores and game history
CREATE TABLE user_scores (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  puzzle_date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  answers JSONB NOT NULL, -- [{guess, correct, article_title}]
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, puzzle_date)
);

-- Score distributions for histogram display
CREATE TABLE score_distributions (
  puzzle_date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(puzzle_date, score)
);

-- Indexes for performance
CREATE INDEX idx_daily_puzzles_date ON daily_puzzles(date);
CREATE INDEX idx_user_scores_user_date ON user_scores(user_id, puzzle_date);
CREATE INDEX idx_user_scores_date ON user_scores(puzzle_date);
CREATE INDEX idx_daily_puzzles_articles ON daily_puzzles (articles);

-- Additional performance indexes
CREATE INDEX idx_articles_used_count ON articles(used_count);
CREATE INDEX idx_articles_title ON articles(title);

-- Database functions for common operations

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

-- Function to increment article usage counts
CREATE OR REPLACE FUNCTION increment_usage_count(article_ids INTEGER[])
RETURNS VOID AS $$
BEGIN
  UPDATE articles 
  SET used_count = used_count + 1 
  WHERE id = ANY(article_ids);
END;
$$ LANGUAGE plpgsql;