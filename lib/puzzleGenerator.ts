import { ArticleSelector } from './articleSelection';
import { WikipediaClient } from './wikipedia';
import { CategoryFilter } from './categoryFilter';
import { Semaphore } from './semaphore';
import { PuzzlesRepository } from './db/puzzles';
import { ArticlesRepository } from './db/articles';
import { Article, PuzzleArticle, CreatePuzzleData } from './db/types';

export class PuzzleGenerator {
  private articleSelector = new ArticleSelector();
  private wikipediaClient = new WikipediaClient();
  private categoryFilter = new CategoryFilter();
  private puzzlesRepo = new PuzzlesRepository();
  private articlesRepo = new ArticlesRepository();

  async generateDailyPuzzle(date: string): Promise<{ success: boolean; message: string; articleCount?: number }> {
    try {
      console.log(`🎯 Starting puzzle generation for ${date}`);

      // 1. Check if puzzle already exists (idempotent)
      const existingPuzzle = await this.puzzlesRepo.getByDate(date);
      if (existingPuzzle) {
        console.log(`✅ Puzzle for ${date} already exists`);
        return {
          success: true,
          message: `Puzzle for ${date} already exists`,
          articleCount: existingPuzzle.articles.length
        };
      }

      // 2. Select unused articles
      console.log(`📖 Selecting 10 unused articles...`);
      const selectedArticles = await this.articleSelector.selectUnusedArticles(10);
      console.log(`✅ Selected ${selectedArticles.length} unused articles`);

      // 3. Enrich articles with metadata
      console.log(`🌐 Fetching metadata from Wikipedia...`);
      const enrichedArticles = await this.enrichArticlesWithMetadata(selectedArticles);
      console.log(`✅ Enriched ${enrichedArticles.length} articles with metadata`);

      // 4. Filter articles with insufficient categories, but be flexible
      let validArticles = enrichedArticles.filter(article => article.categories.length >= 3);
      
      // If we don't have enough with 3+ categories, try 2+ categories
      if (validArticles.length < 10) {
        console.log(`⚠️  Only ${validArticles.length} articles with 3+ categories, trying 2+ categories...`);
        validArticles = enrichedArticles.filter(article => article.categories.length >= 2);
      }
      
      // If still not enough, try 1+ categories
      if (validArticles.length < 10) {
        console.log(`⚠️  Only ${validArticles.length} articles with 2+ categories, trying 1+ categories...`);
        validArticles = enrichedArticles.filter(article => article.categories.length >= 1);
      }
      
      if (validArticles.length < 10) {
        throw new Error(`Insufficient articles with adequate categories after filtering. Got ${validArticles.length}, need 10.`);
      }

      const finalArticles = validArticles.slice(0, 10);

      // 5. Store puzzle and update usage counts
      console.log(`💾 Storing puzzle in database...`);
      await this.storePuzzle(date, finalArticles);
      await this.updateArticleUsageCounts(finalArticles);

      console.log(`✅ Generated puzzle for ${date} with ${finalArticles.length} articles`);

      return {
        success: true,
        message: `Successfully generated puzzle for ${date}`,
        articleCount: finalArticles.length
      };

    } catch (error) {
      console.error(`❌ Failed to generate puzzle for ${date}:`, error);
      return {
        success: false,
        message: `Failed to generate puzzle: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async enrichArticlesWithMetadata(articles: Article[]): Promise<PuzzleArticle[]> {
    const enrichedArticles: PuzzleArticle[] = [];
    
    // Process in parallel but respect rate limits
    const semaphore = new Semaphore(5); // Max 5 concurrent requests

    const promises = articles.map(async (article) => {
      await semaphore.acquire();
      
      try {
        console.log(`  📄 Processing: ${article.title}`);
        
        const [categories, aliases] = await Promise.all([
          this.wikipediaClient.getCategories(article.title),
          this.wikipediaClient.getAliases(article.title)
        ]);

        const filteredCategories = this.categoryFilter.filterCategories(article.title, categories);
        
        console.log(`    ✅ ${article.title}: ${filteredCategories.length} categories, ${aliases.length} aliases`);

        return {
          article_id: article.id,
          title: article.title,
          categories: filteredCategories, // No need to limit with normalized structure
          aliases: aliases.filter(alias => alias !== article.title) // No need to limit aliases
        };

      } catch (error) {
        console.error(`    ❌ Failed to process ${article.title}:`, error);
        // Return article with empty metadata rather than failing completely
        return {
          article_id: article.id,
          title: article.title,
          categories: [],
          aliases: []
        };
      } finally {
        semaphore.release();
      }
    });

    const results = await Promise.all(promises);
    return results;
  }

  private async storePuzzle(date: string, articles: PuzzleArticle[]): Promise<void> {
    const puzzleData: CreatePuzzleData = {
      date,
      articles
    };
    
    await this.puzzlesRepo.create(puzzleData);
  }

  private async updateArticleUsageCounts(articles: PuzzleArticle[]): Promise<void> {
    const articleIds = articles.map(a => a.article_id);
    await this.articlesRepo.incrementUsageCount(articleIds);
  }
}