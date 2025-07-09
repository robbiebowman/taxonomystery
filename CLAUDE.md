# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development Workflow
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Testing
- `npm run test` - Run full test suite (starts test DB, runs Jest, stops test DB)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:setup` - Initialize test environment
- `npm run test:db:start` - Start Supabase local instance for testing
- `npm run test:db:stop` - Stop Supabase local instance

### Database & Scripts
- `npm run seed:articles` - Populate articles table with Wikipedia data
- `npm run test:puzzle` - Test puzzle generation functionality
- `npm run test:api` - Test API endpoints

## Architecture Overview

This is a **Next.js 15** application that creates daily Wikipedia category puzzles. The system follows a multi-layered architecture:

### Core System Components

**Frontend (Next.js App Router)**
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/puzzle/` - Puzzle generation and retrieval endpoints

**Business Logic Layer (`lib/`)**
- `puzzleGenerator.ts` - Core puzzle generation orchestrator
- `articleSelection.ts` - Algorithm for selecting unused Wikipedia articles
- `categoryFilter.ts` - Filters Wikipedia categories for game appropriateness
- `wikipedia.ts` - Wikipedia/Wikidata API client with rate limiting
- `semaphore.ts` - Concurrency control utility

**Database Layer (`lib/db/`)**
- `types.ts` - TypeScript interfaces for all data models
- `articles.ts` - Article repository (10,000 pre-loaded Wikipedia articles)
- `puzzles.ts` - Daily puzzle repository (generated puzzles with metadata)
- `scores.ts` - User scores and game history

### Key Data Flow

1. **Puzzle Generation**: `PuzzleGenerator` orchestrates selecting 10 unused articles, enriching them with Wikipedia categories/aliases, filtering inappropriate categories, and storing the result
2. **Article Selection**: Uses `ArticleSelector` to pick from unused articles pool, ensuring articles have minimum 3 categories after filtering
3. **Category Enrichment**: `WikipediaClient` fetches categories and aliases with rate limiting (5 concurrent requests via `Semaphore`)
4. **Category Filtering**: `CategoryFilter` removes maintenance, self-referential, and overly generic/specific categories

### Database Schema (Supabase PostgreSQL)

- **articles**: Pool of 10,000 Wikipedia articles with usage tracking
- **daily_puzzles**: Generated puzzles with article metadata (categories, aliases)
- **user_scores**: Game results and answer history
- **score_distributions**: Aggregate statistics for result histograms

### External Dependencies

- **Supabase**: PostgreSQL database with real-time features
- **Wikipedia/Wikidata APIs**: Content and metadata fetching
- **Fuse.js**: Fuzzy string matching for answer validation
- **Jest**: Testing framework with Node.js environment

## Development Guidelines

### Testing Strategy
- Unit tests in `__tests__/` directory using Jest
- Database tests require Supabase local instance
- Test files follow `*.test.ts` naming convention

### Database Development
- Migrations stored in both `migrations/` (custom) and `supabase/migrations/` (Supabase CLI)
- Use `scripts/` directory for data seeding and maintenance operations

### API Rate Limiting
- Wikipedia API limited to 5 concurrent requests (enforced by `Semaphore`)
- All external API calls include proper error handling and retries

### Code Organization
- Business logic separated from Next.js framework code
- Repository pattern used for database operations
- Dependency injection used in `PuzzleGenerator` for testability