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
CREATE INDEX idx_daily_puzzles_articles ON daily_puzzles (articles);
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

4. **Create Wikipedia API Client**
   ```typescript
   // lib/wikipedia.ts
   interface WikipediaCategory {
     title: string;
   }
   
   interface WikidataAlias {
     language: string;
     value: string;
   }
   
   class WikipediaClient {
     private readonly baseUrl = 'https://en.wikipedia.org/w/api.php';
     private readonly wikidataUrl = 'https://www.wikidata.org/w/api.php';
     
     async getCategories(title: string): Promise<string[]> {
       // Fetch categories with proper error handling and retries
       // Filter out maintenance categories (Category:Pages with...)
       // Remove namespace prefix (Category:)
       // Handle API rate limits (200 req/sec max)
       // Accept all content types including NSFW
     }
     
     async getAliases(title: string): Promise<string[]> {
       // Query Wikidata for article aliases/redirects
       // Handle multiple languages if needed
       // Deduplicate and normalize aliases
     }
     
     private async retryRequest(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
       // Exponential backoff retry logic
       // Handle Wikipedia API specific errors
     }
   }
   ```

5. **Implement Article Selection Algorithm**
   ```typescript
   // lib/articleSelection.ts
   interface ArticleCandidate {
     id: number;
     title: string;
     used_count: number;
   }
   
   class ArticleSelector {
     async selectUnusedArticles(count: number = 10): Promise<ArticleCandidate[]> {
       // 1. Select only unused articles (used_count = 0)
       // 2. Fail if fewer than required articles available
       // 3. Simple random selection from unused pool
       
       return this.randomSampleFromUnused(count);
     }
     
     private async getUnusedArticles(): Promise<ArticleCandidate[]> {
       // Query articles where used_count = 0
       // Return remaining unused articles
     }
     
     private randomSampleFromUnused(count: number): ArticleCandidate[] {
       // Simple random selection from unused articles
       // Fail if insufficient articles available
     }
   }
   ```

6. **Create Category Filtering System**
   ```typescript
   // lib/categoryFilter.ts
   class CategoryFilter {
     private readonly bannedCategoryPatterns = [
       /^Pages with/i,           // Maintenance categories
       /^Articles with/i,        // Maintenance categories  
       /^CS1/i,                  // Citation style categories
       /^Webarchive/i,           // Archive categories
       /^Use \w+ dates/i,        // Date format categories
       /^Wikipedia/i,            // Meta Wikipedia categories
       /^All articles/i,         // Maintenance categories
     ];
     
     private readonly selfReferentialWords = [
       'articles', 'pages', 'categories', 'lists', 'templates'
     ];
     
     filterCategories(articleTitle: string, categories: string[]): string[] {
       return categories
         .filter(cat => !this.isMaintenance(cat))
         .filter(cat => !this.isSelfReferential(articleTitle, cat))
         .filter(cat => !this.isTooGeneric(cat))
         .filter(cat => !this.isTooSpecific(cat))
         .slice(0, 15); // Limit to prevent overwhelming players
     }
     
     private isSelfReferential(title: string, category: string): boolean {
       const titleWords = title.toLowerCase().split(/\s+/);
       const categoryLower = category.toLowerCase();
       
       // Check if category contains the article title
       return titleWords.some(word => 
         word.length > 3 && categoryLower.includes(word)
       );
     }
     
     private isTooGeneric(category: string): boolean {
       const genericCategories = ['All articles', 'Articles', 'Main topic classifications'];
       return genericCategories.some(generic => category.includes(generic));
     }
     
     private isTooSpecific(category: string): boolean {
       // Categories with very specific years, names, or technical terms
       return /\b(19|20)\d{2}\b/.test(category) || // Specific years
              category.includes('births') ||
              category.includes('deaths') ||
              category.length > 50; // Very long categories tend to be too specific
     }
   }
   ```

7. **Build Comprehensive Puzzle Generator**
   ```typescript
   // lib/puzzleGenerator.ts
   import { ArticleSelector } from './articleSelection';
   import { WikipediaClient } from './wikipedia';
   import { CategoryFilter } from './categoryFilter';
   import { PuzzlesRepository } from './db/puzzles';
   import { ArticlesRepository } from './db/articles';
   
   interface PuzzleArticle {
     article_id: number;
     title: string;
     categories: string[];
     aliases: string[];
   }
   
   class PuzzleGenerator {
     private articleSelector = new ArticleSelector();
     private wikipediaClient = new WikipediaClient();
     private categoryFilter = new CategoryFilter();
     private puzzlesRepo = new PuzzlesRepository();
     private articlesRepo = new ArticlesRepository();
     
     async generateDailyPuzzle(date: string): Promise<void> {
       try {
         // 1. Check if puzzle already exists
         const existingPuzzle = await this.puzzlesRepo.getByDate(date);
         if (existingPuzzle) {
           console.log(`Puzzle for ${date} already exists`);
           return;
         }
         
         // 2. Select articles with validation
         const selectedArticles = await this.selectValidatedArticles();
         
         // 3. Enrich articles with metadata
         const enrichedArticles = await this.enrichArticlesWithMetadata(selectedArticles);
         
         // 4. Validate puzzle quality
         const validatedPuzzle = await this.validatePuzzleQuality(enrichedArticles);
         
         // 5. Store puzzle and update usage counts
         await this.storePuzzle(date, validatedPuzzle);
         await this.updateArticleUsageCounts(validatedPuzzle);
         
         console.log(`✅ Generated puzzle for ${date} with ${validatedPuzzle.length} articles`);
         
       } catch (error) {
         console.error(`❌ Failed to generate puzzle for ${date}:`, error);
         throw error;
       }
     }
     
     private async selectValidatedArticles(): Promise<Article[]> {
       let attempts = 0;
       const maxAttempts = 3;
       
       while (attempts < maxAttempts) {
         const candidates = await this.articleSelector.selectOptimalArticles(12); // Select extra for validation
         const validArticles = [];
         
         for (const candidate of candidates) {
           const isValid = await this.wikipediaClient.validateArticle(candidate.title);
           if (isValid) {
             validArticles.push(candidate);
             if (validArticles.length === 10) break;
           }
         }
         
         if (validArticles.length === 10) {
           return validArticles;
         }
         
         attempts++;
       }
       
       throw new Error('Failed to select sufficient valid articles after multiple attempts');
     }
     
     private async enrichArticlesWithMetadata(articles: Article[]): Promise<PuzzleArticle[]> {
       const enrichedArticles: PuzzleArticle[] = [];
       
       // Process in parallel but respect rate limits
       const semaphore = new Semaphore(5); // Max 5 concurrent requests
       
       const promises = articles.map(async (article) => {
         await semaphore.acquire();
         
         try {
           const [categories, aliases] = await Promise.all([
             this.wikipediaClient.getCategories(article.title),
             this.wikipediaClient.getAliases(article.title)
           ]);
           
           const filteredCategories = this.categoryFilter.filterCategories(article.title, categories);
           
           return {
             article_id: article.id,
             title: article.title,
             categories: filteredCategories,
             aliases: aliases.filter(alias => alias !== article.title) // Remove self-reference
           };
           
         } finally {
           semaphore.release();
         }
       });
       
       const results = await Promise.all(promises);
       return results.filter(result => result.categories.length >= 3); // Ensure minimum categories
     }
     
     private async validatePuzzleQuality(articles: PuzzleArticle[]): Promise<PuzzleArticle[]> {
       // Ensure puzzle has good difficulty balance
       const categoryCount = new Map<string, number>();
       
       articles.forEach(article => {
         article.categories.forEach(cat => {
           categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
         });
       });
       
       // Check for diversity - no single category should dominate
       const maxCategoryFrequency = Math.max(...categoryCount.values());
       if (maxCategoryFrequency > articles.length * 0.6) {
         throw new Error('Puzzle lacks category diversity');
       }
       
       // Ensure each article has sufficient metadata
       const validArticles = articles.filter(article => 
         article.categories.length >= 3 && 
         article.categories.length <= 15
       );
       
       if (validArticles.length < 8) {
         throw new Error('Insufficient articles with adequate metadata');
       }
       
       return validArticles.slice(0, 10); // Return exactly 10 articles
     }
     
     private async storePuzzle(date: string, articles: PuzzleArticle[]): Promise<void> {
       await this.puzzlesRepo.create({
         date,
         articles
       });
     }
     
     private async updateArticleUsageCounts(articles: PuzzleArticle[]): Promise<void> {
       const articleIds = articles.map(a => a.article_id);
       await this.articlesRepo.incrementUsageCount(articleIds);
     }
   }
   
   // Utility class for rate limiting
   class Semaphore {
     private permits: number;
     private queue: (() => void)[] = [];
     
     constructor(permits: number) {
       this.permits = permits;
     }
     
     async acquire(): Promise<void> {
       return new Promise(resolve => {
         if (this.permits > 0) {
           this.permits--;
           resolve();
         } else {
           this.queue.push(resolve);
         }
       });
     }
     
     release(): void {
       this.permits++;
       if (this.queue.length > 0) {
         const next = this.queue.shift()!;
         this.permits--;
         next();
       }
     }
   }
   ```

8. **Create Robust Cron Job Handler**
   ```typescript
   // pages/api/cron/generate-puzzle.ts
   import type { NextApiRequest, NextApiResponse } from 'next';
   import { PuzzleGenerator } from '../../../lib/puzzleGenerator';
   
   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     // Security: Verify cron secret
     if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }
     
     const generator = new PuzzleGenerator();
     
     try {
       // Generate puzzle for tomorrow
       const tomorrow = new Date();
       tomorrow.setDate(tomorrow.getDate() + 1);
       const dateString = tomorrow.toISOString().split('T')[0];
       
       console.log(`🎯 Starting puzzle generation for ${dateString}`);
       
       await generator.generateDailyPuzzle(dateString);
       
       res.status(200).json({ 
         success: true, 
         date: dateString,
         message: 'Puzzle generated successfully' 
       });
       
     } catch (error) {
       console.error('Cron job failed:', error);
       
       // Send notification to monitoring service
       await notifyError(`Puzzle generation failed: ${error.message}`);
       
       res.status(500).json({ 
         success: false, 
         error: error.message 
       });
     }
   }
   
   async function notifyError(message: string): Promise<void> {
     // Implementation depends on monitoring solution
     // Could be email, Slack webhook, error tracking service, etc.
     console.error('ALERT:', message);
   }
   ```

9. **Setup Vercel Cron Configuration**
   ```json
   // vercel.json
   {
     "crons": [{
       "path": "/api/cron/generate-puzzle",
       "schedule": "0 2 * * *"
     }]
   }
   ```

10. **Environment Variables Setup**
    ```env
    # Add to .env.local
    CRON_SECRET=your-secure-random-string-here
    WIKIPEDIA_USER_AGENT=TaxonomyMystery/1.0 (your-email@example.com)
    ```

11. **Testing & Validation Scripts**
    ```typescript
    // scripts/test-puzzle-generation.ts
    import { PuzzleGenerator } from '../lib/puzzleGenerator';
    
    async function testPuzzleGeneration() {
      const generator = new PuzzleGenerator();
      const testDate = '2024-01-15'; // Use a test date
      
      try {
        await generator.generateDailyPuzzle(testDate);
        console.log('✅ Puzzle generation test successful');
        
        // Verify puzzle was stored correctly
        const puzzle = await new PuzzlesRepository().getByDate(testDate);
        console.log(`Generated puzzle with ${puzzle?.articles.length} articles`);
        
      } catch (error) {
        console.error('❌ Puzzle generation test failed:', error);
      }
    }
    
    testPuzzleGeneration();
    ```

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