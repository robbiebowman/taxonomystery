# Taxonomystery Database Migrations

This directory contains all SQL migrations for the Taxonomystery project, organized chronologically with descriptive naming.

## Migration Naming Convention

Migrations follow the pattern: `V##__description.sql`

- `V##` - Version number with zero padding (V01, V02, etc.)
- `__` - Double underscore separator
- `description` - Snake_case description of the migration

## Migration History

### V01__initial_database_schema.sql
- **Purpose**: Original database schema based on design documentation
- **Status**: Design reference (not applied to production)
- **Contents**: Complete initial schema with all tables and functions

### V02__fix_schema_compatibility.sql
- **Purpose**: Fixes for compatibility issues between design and implementation
- **Status**: Design reference (not applied to production)
- **Contents**: Type fixes, constraint adjustments, missing indexes

### V03__normalize_puzzle_articles.sql
- **Purpose**: Normalize puzzle storage to avoid JSONB size limits
- **Status**: Design reference (not applied to production)
- **Contents**: puzzle_articles table, normalization functions

### V04__remove_legacy_articles_column.sql
- **Purpose**: Complete migration to normalized structure
- **Status**: Design reference (not applied to production)
- **Contents**: Remove JSONB articles column, update functions

### V05__supabase_initial_implementation.sql
- **Purpose**: First migration actually applied to Supabase during development
- **Status**: ✅ Applied to production
- **Contents**: Working schema as implemented in Supabase

### V06__supabase_normalize_implementation.sql
- **Purpose**: Normalization migration applied to Supabase
- **Status**: ✅ Applied to production
- **Contents**: puzzle_articles table creation (Supabase version)

### V07__production_migration_original.sql
- **Purpose**: Comprehensive production migration script
- **Status**: ✅ Applied to production
- **Contents**: Complete normalization for production deployment

### V08__production_migration_fix.sql
- **Purpose**: Fix issues discovered after initial normalization
- **Status**: ✅ Applied to production
- **Contents**: Remove legacy JSONB column, fix functions

### V09__fix_get_function_type_mismatch.sql
- **Purpose**: Fix type mismatch in get_puzzle_with_articles function
- **Status**: ⚠️ Available for application
- **Contents**: Type casting fix for DATE fields

## Current Production Schema

After all applied migrations, the production database has:

### Tables
- `articles` - Wikipedia article pool (id, title, wikipedia_url, used_count, created_at)
- `daily_puzzles` - Daily puzzle metadata (id, date, article_count, created_at)
- `puzzle_articles` - Normalized article details (id, puzzle_id, article_id, title, categories, aliases, created_at)
- `user_scores` - User game results (id, user_id, puzzle_date, score, answers, completed_at)
- `score_distributions` - Score statistics (puzzle_date, score, count)

### Functions
- `create_puzzle_with_articles(date, articles_data)` - Create normalized puzzle
- `get_puzzle_with_articles(date)` - Retrieve puzzle with articles
- `increment_usage_count(article_ids[])` - Update article usage counts
- `upsert_score_distribution(date, score)` - Update score statistics

### Key Features
- ✅ Unlimited categories and aliases per article
- ✅ No JSONB size limit constraints
- ✅ Normalized, scalable storage structure
- ✅ Backward compatibility support

## Applying Migrations

### For Supabase
1. Copy SQL content from migration file
2. Execute in Supabase SQL Editor
3. Verify successful execution
4. Update this README with application status

### For Other Databases
Migration files are standard PostgreSQL and should work with any PostgreSQL database with appropriate adjustments for auth table references.