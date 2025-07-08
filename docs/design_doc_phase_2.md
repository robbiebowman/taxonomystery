# Phase 2: Daily Puzzle Generation - Detailed Implementation Guide

## Overview

Phase 2 focuses on building a robust, production-ready puzzle generation system that automatically creates high-quality daily puzzles using Wikipedia data. This system must handle API failures gracefully, ensure puzzle quality, and scale to support thousands of daily users.

## Architecture Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel Cron   │───▶│ Puzzle Generator │───▶│   Supabase DB   │
│   (2 AM UTC)    │    │                  │    │                 │
└─────────────────┘    └──────────┬───────┘    └─────────────────┘
                                  │
                                  ▼
                       ┌──────────────────┐
                       │  Wikipedia APIs  │
                       │ • Categories API │
                       │ • Wikidata API   │
                       └──────────────────┘
```

## Implementation Breakdown

### 1. Wikipedia API Client (`lib/wikipedia.ts`)

**Purpose**: Reliable interface to Wikipedia and Wikidata APIs with proper error handling and rate limiting.

```typescript
class WikipediaClient {
  private readonly baseUrl = 'https://en.wikipedia.org/w/api.php';
  private readonly wikidataUrl = 'https://www.wikidata.org/w/api.php';
  private readonly userAgent = process.env.WIKIPEDIA_USER_AGENT;
  
  async getCategories(title: string): Promise<string[]>
  async getAliases(title: string): Promise<string[]>
  async validateArticle(title: string): Promise<boolean>
  private async retryRequest(fn: () => Promise<any>, maxRetries = 3): Promise<any>
}
```

**Key Features**:
- ✅ **Rate Limiting**: Respects Wikipedia's 200 req/sec limit
- ✅ **Retry Logic**: Exponential backoff for failed requests
- ✅ **Error Classification**: Distinguishes between temporary and permanent failures
- ✅ **User Agent**: Proper identification for API requests
- ✅ **Data Validation**: Ensures returned data is properly formatted
- ✅ **No Content Filtering**: Accepts all category types including NSFW content

**API Endpoints Used**:
- Categories: `https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=categories&format=json`
- Aliases: `https://www.wikidata.org/w/api.php?action=wbgetentities&titles={title}&sites=enwiki&props=aliases&format=json`

### 2. Article Selection Algorithm (`lib/articleSelection.ts`)

**Purpose**: Selection of unused articles from the pre-validated high-quality article pool.

```typescript
class ArticleSelector {
  async selectUnusedArticles(count: number = 10): Promise<ArticleCandidate[]>
  private async getUnusedArticles(): Promise<ArticleCandidate[]>
  private randomSample(candidates: ArticleCandidate[], count: number): ArticleCandidate[]
}
```

**Selection Algorithm**:
1. **Unused Articles Only**: `used_count = 0` - only select articles that have never been used
2. **No Reuse Policy**: If fewer than 10 unused articles remain, fail the generation
3. **Random Selection**: Simple random selection from unused article pool

**Quality Filters**:
- Articles are pre-validated in the seed data (10,000 high-quality articles)
- No runtime quality validation needed

### 3. Category Filtering System (`lib/categoryFilter.ts`)

**Purpose**: Clean and curate Wikipedia categories to create meaningful, non-obvious clues for players.

```typescript
class CategoryFilter {
  filterCategories(articleTitle: string, categories: string[]): string[]
  private isMaintenance(category: string): boolean
  private isSelfReferential(title: string, category: string): boolean
  private isTooGeneric(category: string): boolean
  private isTooSpecific(category: string): boolean
}
```

**Filtering Rules**:

**❌ Maintenance Categories**:
- `Pages with...` - Wikipedia maintenance
- `Articles with...` - Content issues  
- `CS1...` - Citation style categories
- `Webarchive...` - Archive categories
- `Use [language] dates` - Date format preferences

**❌ Self-Referential Categories**:
- Categories containing the article title
- Generic terms like "articles", "pages", "lists"

**❌ Too Generic**:
- "All articles"
- "Main topic classifications"
- Single-word categories

**❌ Too Specific**:
- Specific years (1985, 2023)
- Birth/death categories
- Very long category names (>50 chars)

**✅ Ideal Categories**:
- Topic-based: "Ancient Greek philosophers"
- Geographic: "Cities in France"
- Temporal: "20th-century events"
- Functional: "Transport companies"

### 4. Comprehensive Puzzle Generator (`lib/puzzleGenerator.ts`)

**Purpose**: Orchestrates the entire puzzle creation process using only unused articles with robust error handling.

```typescript
class PuzzleGenerator {
  async generateDailyPuzzle(date: string): Promise<void>
  private async selectUnusedArticles(): Promise<Article[]>
  private async enrichArticlesWithMetadata(articles: Article[]): Promise<PuzzleArticle[]>
  private async storePuzzle(date: string, articles: PuzzleArticle[]): Promise<void>
}
```

**Generation Pipeline**:

1. **Existence Check**: Verify puzzle doesn't already exist
2. **Article Selection**: Get exactly 10 unused articles (fail if insufficient)
3. **Metadata Enrichment**: Fetch categories and aliases in parallel
4. **Category Filtering**: Remove maintenance and self-referential categories
5. **Final Validation**: Ensure articles have sufficient categories after filtering
6. **Storage**: Save to database and update usage counts

**Quality Metrics**:
- ✅ **Unused Articles**: All selected articles have `used_count = 0`
- ✅ **Metadata Sufficiency**: Each article has 3+ categories after filtering
- ✅ **Category Filtering**: Maintenance and self-referential categories removed
- ✅ **Alias Coverage**: Articles have meaningful alternative names when available

**Error Recovery**:
- **API Failures**: Retry with exponential backoff
- **Insufficient Unused Articles**: Fail generation (no reuse allowed)
- **Insufficient Categories**: Skip articles with <3 categories after filtering
- **Rate Limiting**: Respect API limits with semaphore pattern

### 5. Parallel Processing with Rate Limiting

**Purpose**: Efficiently process multiple Wikipedia API requests while respecting rate limits.

```typescript
class Semaphore {
  constructor(permits: number)
  async acquire(): Promise<void>
  release(): void
}
```

**Concurrency Strategy**:
- **Max Concurrent Requests**: 5 simultaneous API calls
- **Queue Management**: FIFO queue for waiting requests
- **Timeout Handling**: 30-second timeout per request
- **Resource Cleanup**: Automatic permit release on completion

### 6. Cron Job Implementation (`pages/api/cron/generate-puzzle.ts`)

**Purpose**: Secure, monitored endpoint for automated daily puzzle generation.

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security verification
  // Method validation
  // Puzzle generation
  // Error handling & monitoring
}
```

**Security Features**:
- ✅ **Bearer Token Authentication**: `CRON_SECRET` verification
- ✅ **Method Restriction**: Only POST requests allowed
- ✅ **Rate Limiting**: Additional protection against abuse
- ✅ **Error Logging**: Comprehensive error tracking

**Monitoring**:
- **Success Metrics**: Puzzle generation time, article count
- **Error Alerts**: Failed API calls, quality validation failures
- **Performance Tracking**: Wikipedia API response times
- **Usage Statistics**: Article selection patterns

## Configuration & Deployment

### Environment Variables

```env
# Required for Wikipedia API
WIKIPEDIA_USER_AGENT=TaxonomyMystery/1.0 (your-email@example.com)

# Security
CRON_SECRET=your-secure-random-string-here

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Vercel Cron Configuration

```json
{
  "crons": [{
    "path": "/api/cron/generate-puzzle",
    "schedule": "0 2 * * *"
  }]
}
```

**Schedule Explanation**:
- **Time**: 2:00 AM UTC daily
- **Reasoning**: Low traffic period, allows time for error recovery
- **Target**: Generate puzzle for the following day

### Package Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.50.3",
    "fuse.js": "^7.1.0",
    "date-fns": "^4.1.0"
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// Test category filtering
describe('CategoryFilter', () => {
  it('should filter maintenance categories')
  it('should remove self-referential categories')
  it('should handle edge cases')
})

// Test article selection
describe('ArticleSelector', () => {
  it('should select only unused articles')
  it('should fail when insufficient articles available')
  it('should randomly sample from unused pool')
})
```

### Integration Tests

```typescript
// Test Wikipedia API client
describe('WikipediaClient', () => {
  it('should fetch categories successfully')
  it('should handle API failures gracefully')
  it('should respect rate limits')
})

// Test full puzzle generation
describe('PuzzleGenerator', () => {
  it('should generate complete puzzle')
  it('should handle API failures')
  it('should maintain quality standards')
})
```

### Manual Testing Script

```typescript
// scripts/test-puzzle-generation.ts
async function testPuzzleGeneration() {
  const generator = new PuzzleGenerator();
  const testDate = '2024-01-15';
  
  await generator.generateDailyPuzzle(testDate);
  
  // Verify puzzle quality
  const puzzle = await new PuzzlesRepository().getByDate(testDate);
  console.log(`Generated puzzle with ${puzzle?.articles.length} articles`);
  
  // Analyze categories
  const allCategories = puzzle?.articles.flatMap(a => a.categories) || [];
  const uniqueCategories = new Set(allCategories);
  console.log(`Total categories: ${allCategories.length}, Unique: ${uniqueCategories.size}`);
}
```

## Performance Considerations

### API Rate Limiting
- **Wikipedia Limit**: 200 requests/second
- **Our Limit**: 5 concurrent requests (well below threshold)
- **Burst Protection**: Semaphore prevents overwhelming APIs
- **Timeout Strategy**: 30-second timeout with 3 retries

### Database Optimization
- **Indexes**: Efficient queries on date and article usage
- **Connection Pooling**: Supabase handles connection management
- **Batch Operations**: Bulk updates for usage counts
- **Query Optimization**: Minimized round trips

### Memory Management
- **Streaming**: Process articles individually, not in bulk
- **Garbage Collection**: Explicit cleanup of large objects
- **Memory Monitoring**: Track memory usage during generation
- **Resource Limits**: Vercel function memory constraints

## Error Handling & Recovery

### Wikipedia API Failures
```typescript
async function handleWikipediaError(error: any, articleTitle: string): Promise<void> {
  if (error.code === 'RATE_LIMITED') {
    await delay(error.retryAfter * 1000);
    // Retry with exponential backoff
  } else if (error.code === 'NOT_FOUND') {
    // Skip this article, select replacement
  } else {
    // Log error and continue with remaining articles
  }
}
```

### Quality Validation Failures
- **Insufficient Categories**: Retry with different articles
- **Poor Diversity**: Re-run selection algorithm
- **Low Quality Score**: Adjust filtering parameters
- **Missing Aliases**: Fallback to article title variations

### Database Failures
- **Connection Issues**: Retry with exponential backoff
- **Constraint Violations**: Handle duplicate puzzle dates
- **Transaction Failures**: Rollback and retry
- **Storage Limits**: Monitor database usage

## Monitoring & Alerting

### Success Metrics
- ✅ Puzzle generated successfully
- ✅ All 10 articles are unused (used_count = 0)
- ✅ Articles have sufficient categories after filtering
- ✅ Generation time < 2 minutes

### Error Alerts
- ❌ Wikipedia API failures > 20%
- ❌ Puzzle generation complete failure
- ❌ Quality validation failures
- ❌ Database connection issues

### Performance Monitoring
- 📊 Average generation time
- 📊 Wikipedia API response times
- 📊 Category filtering effectiveness
- 📊 Article selection distribution

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Wikipedia User-Agent set
- [ ] Cron secret generated and secured
- [ ] Vercel cron job scheduled
- [ ] Error monitoring implemented
- [ ] Test puzzle generation manually
- [ ] Verify database permissions
- [ ] Check API rate limit compliance
- [ ] Monitor first automated run
- [ ] Set up alerting for failures

## Future Enhancements

### Phase 2.1: Quality Improvements
- **Machine Learning**: Train model to predict puzzle difficulty
- **A/B Testing**: Test different category filtering strategies
- **User Feedback**: Incorporate player difficulty ratings
- **Content Analysis**: Analyze Wikipedia content quality

### Phase 2.2: Performance Optimization
- **Caching**: Cache Wikipedia responses for popular articles
- **Precomputation**: Pre-fetch metadata for likely candidates
- **CDN Integration**: Distribute puzzle data globally
- **Database Optimization**: Advanced indexing strategies

### Phase 2.3: Advanced Features
- **Themed Puzzles**: Generate puzzles around specific topics
- **Difficulty Levels**: Easy/Medium/Hard puzzle variants
- **Seasonal Content**: Holiday or event-themed puzzles
- **Multi-language Support**: Support for other Wikipedia languages

This comprehensive implementation plan ensures Phase 2 delivers a robust, scalable, and maintainable puzzle generation system that can reliably create high-quality daily puzzles for thousands of users.