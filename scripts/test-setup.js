const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupTestDatabase() {
  const client = new Client({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    database: process.env.TEST_DB_NAME || 'taxonomystery_test',
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to test database');

    // Drop existing tables if they exist
    await client.query(`
      DROP TABLE IF EXISTS score_distributions CASCADE;
      DROP TABLE IF EXISTS user_scores CASCADE;
      DROP TABLE IF EXISTS daily_puzzles CASCADE;
      DROP TABLE IF EXISTS articles CASCADE;
    `);

    // Create tables from design doc schema
    const schema = `
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
        articles JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- User scores and game history
      CREATE TABLE user_scores (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        puzzle_date DATE NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
        answers JSONB NOT NULL,
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

      -- RPC function for incrementing usage count
      CREATE OR REPLACE FUNCTION increment_usage_count(article_ids INTEGER[])
      RETURNS VOID AS $$
      BEGIN
        UPDATE articles 
        SET used_count = used_count + 1 
        WHERE id = ANY(article_ids);
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(schema);
    console.log('Test database schema created successfully');

  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupTestDatabase();