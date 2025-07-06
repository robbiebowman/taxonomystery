import { ArticlesRepository } from '../lib/db/articles';
import { cleanupDatabase, insertTestArticles } from './test-utils';

describe('ArticlesRepository', () => {
  let repository: ArticlesRepository;

  beforeAll(() => {
    repository = new ArticlesRepository();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('getRandomUnusedArticles', () => {
    it('should return random articles ordered by usage count', async () => {
      await insertTestArticles();
      
      const articles = await repository.getRandomUnusedArticles(2);
      
      expect(articles).toHaveLength(2);
      expect(articles[0]).toHaveProperty('id');
      expect(articles[0]).toHaveProperty('title');
      expect(articles[0]).toHaveProperty('wikipedia_url');
      expect(articles[0]).toHaveProperty('used_count');
      expect(articles[0].used_count).toBe(0);
    });

    it('should return empty array when no articles exist', async () => {
      const articles = await repository.getRandomUnusedArticles(5);
      expect(articles).toHaveLength(0);
    });

    it('should limit results to requested count', async () => {
      await insertTestArticles();
      
      const articles = await repository.getRandomUnusedArticles(1);
      expect(articles).toHaveLength(1);
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usage count for specified articles', async () => {
      const testArticles = await insertTestArticles();
      const articleIds = testArticles.map(a => a.id);
      
      await repository.incrementUsageCount(articleIds);
      
      const updatedArticles = await repository.getRandomUnusedArticles(10);
      updatedArticles.forEach(article => {
        expect(article.used_count).toBe(1);
      });
    });

    it('should handle empty array', async () => {
      await expect(repository.incrementUsageCount([])).resolves.not.toThrow();
    });
  });

  describe('createBulk', () => {
    it('should create multiple articles', async () => {
      const articles = [
        { title: 'Bulk Article 1', wikipedia_url: 'https://example.com/1' },
        { title: 'Bulk Article 2', wikipedia_url: 'https://example.com/2' }
      ];
      
      await repository.createBulk(articles);
      
      const created = await repository.getRandomUnusedArticles(10);
      expect(created).toHaveLength(2);
      expect(created.map(a => a.title)).toEqual(
        expect.arrayContaining(['Bulk Article 1', 'Bulk Article 2'])
      );
    });

    it('should handle empty array', async () => {
      await expect(repository.createBulk([])).resolves.not.toThrow();
    });
  });
});