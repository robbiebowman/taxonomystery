# Taxonomystery - Technical Design Document

## Architecture Overview

### Tech Stack
- **Frontend**: React/Next.js deployed on Vercel
- **Backend**: Serverless API routes (Vercel functions)
- **Database**: Supabase (PostgreSQL with real-time features)
- **External APIs**: Wikipedia API, Wikidata API
- **Authentication**: Supabase Auth

### System Architecture
```
Frontend (Vercel) → API Routes → Supabase DB
                  ↓
             Wikipedia/Wikidata APIs
```

## Database Schema

```sql
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
CREATE GIN INDEX idx_daily_puzzles_articles ON daily_puzzles USING GIN (articles);
```

## API Endpoints

### External APIs
- **Wikipedia Categories**: `https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=categories&format=json`
- **Wikidata Aliases**: `https://www.wikidata.org/w/api.php?action=wbgetentities&titles={title}&sites=enwiki&props=aliases&format=json`

### Internal API Routes
- `GET /api/puzzle/[date]` - Get daily puzzle
- `POST /api/puzzle/[date]/submit` - Submit answers
- `GET /api/scores/[date]` - Get score distribution
- `GET /api/user/history` - Get user's game history

## Implementation Plan

### Phase 1: Setup & Database (Days 1-2)

1. **Initialize Next.js Project**
   ```bash
   npx create-next-app@latest taxonomystery --typescript --tailwind --app
   cd taxonomystery
   npm install @supabase/supabase-js fuse.js date-fns
   ```

2. **Setup Supabase**
   - Create Supabase project
   - Run database schema from above
   - Configure environment variables:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_key
     ```

3. **Load Article Data**
   - Create script to populate `articles` table with 10,000 Wikipedia titles
   - Add data validation and duplicate prevention

### Phase 2: Daily Puzzle Generation (Days 3-4)

4. **Create Puzzle Generator**
   ```typescript
   // lib/puzzleGenerator.ts
   async function generateDailyPuzzle(date: string) {
     // 1. Select 10 random unused articles
     // 2. Fetch categories from Wikipedia API
     // 3. Filter self-referential categories
     // 4. Fetch aliases from Wikidata
     // 5. Store in daily_puzzles table
   }
   ```

5. **Setup Cron Job**
   ```typescript
   // api/cron/generate-puzzle.ts
   export default async function handler(req, res) {
     // Verify cron secret for security
     // Generate puzzle for tomorrow's date
     // Handle API rate limits and errors
   }
   ```
   - Configure Vercel cron: `0 0 * * *` (daily at UTC midnight)

### Phase 3: Core Game Logic (Days 5-7)

6. **Fuzzy Matching System**
   ```typescript
   // lib/fuzzyMatch.ts
   import Fuse from 'fuse.js'
   
   function checkAnswer(guess: string, correctAnswers: string[]): boolean {
     // Use Fuse.js with threshold ~0.7 for typo tolerance
     // Check against article title + all aliases
   }
   ```

7. **Game State Management**
   ```typescript
   // Context for current game state
   // Track guesses, reveals, current article index
   // Handle submission logic
   ```

### Phase 4: User Interface (Days 8-10)

8. **Game Components**
   - `GameBoard` - Main game interface
   - `CategoryList` - Display filtered categories
   - `GuessInput` - Input with validation
   - `ScoreDisplay` - End game results
   - `ScoreHistogram` - Distribution chart

9. **Authentication Pages**
   - Login/signup with Supabase Auth
   - Optional anonymous play with localStorage
   - Profile page with game history

### Phase 5: API Implementation (Days 11-12)

10. **API Routes**
    ```typescript
    // api/puzzle/[date].ts - Get puzzle data
    // api/puzzle/[date]/submit.ts - Submit answers
    // api/scores/[date].ts - Get score distribution
    // api/user/history.ts - User's past games
    ```

11. **Data Processing**
    - Category filtering logic
    - Score calculation and storage
    - Distribution updates

### Phase 6: Polish & Deploy (Days 13-14)

12. **Error Handling & Validation**
    - API error boundaries
    - Form validation
    - Loading states

13. **Performance Optimization**
    - Client-side caching
    - Database query optimization
    - Image optimization

14. **Deploy to Vercel**
    - Configure environment variables
    - Set up domain (optional)
    - Monitor initial usage

## Technical Considerations

### Performance
- **Database Indexing**: GIN indexes on JSONB columns for fast category/alias searches
- **Caching**: Cache daily puzzles in memory/CDN
- **Rate Limiting**: Respect Wikipedia API limits (200 req/sec max)

### Security
- **Cron Protection**: Verify secret token for cron endpoints
- **Input Validation**: Sanitize all user inputs
- **SQL Injection**: Use parameterized queries via Supabase client

### Error Handling
- **Wikipedia API Failures**: Fallback to cached data or skip problematic articles
- **Database Constraints**: Handle duplicate submissions gracefully
- **Fuzzy Matching Edge Cases**: Set minimum similarity thresholds (0.6-0.8)

### Monitoring
- **Supabase Dashboard**: Track API usage and database performance
- **Vercel Analytics**: Monitor function execution times
- **Error Logging**: Capture failed puzzle generations

## Development Tips

### Data Processing
```typescript
// Filter self-referential categories
function filterCategories(title: string, categories: string[]): string[] {
  return categories.filter(cat => 
    !cat.toLowerCase().includes(title.toLowerCase())
  )
}

// Normalize category names
function normalizeCategory(category: string): string {
  return category.replace(/^Category:/, '').trim()
}
```

### Testing Strategy
1. **Unit Tests**: Fuzzy matching, category filtering
2. **Integration Tests**: API endpoints, database operations
3. **Manual Testing**: Complete game flow, edge cases

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Cron job scheduled
- [ ] Articles data loaded
- [ ] Error monitoring setup

## Estimated Timeline
- **Total Development**: 14 days
- **MVP Launch**: Day 15
- **Initial User Testing**: Days 16-20
- **Iteration & Improvements**: Ongoing

This plan provides a clear roadmap for a junior developer to implement Taxonomystery systematically, with specific technical details and code examples for each phase.