-- Fix schema compatibility issues discovered during implementation
-- This migration addresses differences between design doc and actual implementation

-- Fix articles table: add UNIQUE constraint and update timestamp type
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_title_key;
ALTER TABLE articles ADD CONSTRAINT articles_title_unique UNIQUE (title);
ALTER TABLE articles ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Fix daily_puzzles table: update timestamp type  
ALTER TABLE daily_puzzles ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Fix user_scores table: change user_id type to TEXT for broader compatibility
-- This allows for both UUID and string-based user IDs depending on auth system
ALTER TABLE user_scores DROP CONSTRAINT IF EXISTS user_scores_user_id_fkey;
ALTER TABLE user_scores ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE user_scores ALTER COLUMN completed_at TYPE TIMESTAMP WITH TIME ZONE;

-- Update score_distributions to remove unnecessary DEFAULT constraint
ALTER TABLE score_distributions ALTER COLUMN count SET DEFAULT 1;

-- Add missing indexes from implementation
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_puzzle_date ON user_scores(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_score_distributions_puzzle_date ON score_distributions(puzzle_date);