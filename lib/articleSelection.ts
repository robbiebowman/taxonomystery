import { ArticlesRepository } from './db/articles';
import { Article } from './db/types';

// interface ArticleCandidate {
//   id: number;
//   title: string;
//   used_count: number;
// }

export class ArticleSelector {
  private articlesRepo = new ArticlesRepository();

  async selectUnusedArticles(count: number = 10, excludeIds: number[] = []): Promise<Article[]> {
    // Get all unused articles
    let unusedArticles = await this.getUnusedArticles();

    // Filter out excluded articles
    if (excludeIds.length > 0) {
      const excludeSet = new Set(excludeIds);
      unusedArticles = unusedArticles.filter(article => !excludeSet.has(article.id));
    }
    
    // Check if we have enough unused articles
    if (unusedArticles.length < count) {
      throw new Error(
        `Insufficient unused articles available. Need ${count}, but only ${unusedArticles.length} remain unused.`
      );
    }

    // Randomly select the required number of articles
    return this.randomSample(unusedArticles, count);
  }

  private async getUnusedArticles(): Promise<Article[]> {
    // Using the existing getRandomUnusedArticles method, but get a large number
    // and filter for truly unused ones (used_count = 0)
    const candidates = await this.articlesRepo.getRandomUnusedArticles(5000);
    
    // Filter to only truly unused articles
    return candidates.filter(article => article.used_count === 0);
  }

  private randomSample<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}