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

      // 2. Select articles with minimum category requirement
      console.log(`📖 Selecting 10 articles with at least 3 categories...`);
      const finalArticles = await this.selectArticlesWithMinimumCategories(10);
      console.log(`✅ Selected ${finalArticles.length} articles with adequate categories`);

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

  private async selectArticlesWithMinimumCategories(count: number): Promise<PuzzleArticle[]> {
    const validArticles: PuzzleArticle[] = [];
    const rejectedArticleIds: number[] = [];
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops

    while (validArticles.length < count && attempts < maxAttempts) {
      attempts++;
      
      // Select more articles than needed to account for rejections
      const batchSize = Math.max(count - validArticles.length, 5);
      console.log(`  📖 Selecting batch of ${batchSize} articles (attempt ${attempts})...`);
      
      const selectedArticles = await this.articleSelector.selectUnusedArticles(batchSize);
      if (selectedArticles.length === 0) {
        throw new Error('No more unused articles available');
      }

      console.log(`  🌐 Fetching metadata for ${selectedArticles.length} articles...`);
      const enrichedArticles = await this.enrichArticlesWithMetadata(selectedArticles);

      for (const article of enrichedArticles) {
        if (article.categories.length >= 3) {
          validArticles.push(article);
          console.log(`    ✅ ${article.title}: ${article.categories.length} categories (accepted)`);
          
          if (validArticles.length >= count) break;
        } else {
          // Mark article as used even though we're rejecting it
          rejectedArticleIds.push(article.article_id);
          console.log(`    ❌ ${article.title}: only ${article.categories.length} categories (rejected, marking as used)`);
        }
      }
    }

    if (validArticles.length < count) {
      throw new Error(`Could not find ${count} articles with minimum 3 categories after ${attempts} attempts. Found ${validArticles.length}.`);
    }

    // Mark rejected articles as used so they won't be selected again
    if (rejectedArticleIds.length > 0) {
      console.log(`  🚫 Marking ${rejectedArticleIds.length} rejected articles as used...`);
      await this.articlesRepo.incrementUsageCount(rejectedArticleIds);
    }

    return validArticles.slice(0, count);
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
          categories: filteredCategories,
          aliases: aliases.filter(alias => alias !== article.title)
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