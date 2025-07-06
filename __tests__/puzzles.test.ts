import { PuzzlesRepository } from '../lib/db/puzzles';
import { cleanupDatabase, mockPuzzleArticles } from './test-utils';

describe('PuzzlesRepository', () => {
  let repository: PuzzlesRepository;

  beforeAll(() => {
    repository = new PuzzlesRepository();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('create', () => {
    it('should create a daily puzzle', async () => {
      const puzzleData = {
        date: '2024-01-01',
        articles: mockPuzzleArticles
      };
      
      const puzzle = await repository.create(puzzleData);
      
      expect(puzzle).toHaveProperty('id');
      expect(puzzle.date).toBe('2024-01-01');
      expect(puzzle.articles).toEqual(mockPuzzleArticles);
      expect(puzzle).toHaveProperty('created_at');
    });

    it('should throw error for duplicate date', async () => {
      const puzzleData = {
        date: '2024-01-01',
        articles: mockPuzzleArticles
      };
      
      await repository.create(puzzleData);
      
      await expect(repository.create(puzzleData)).rejects.toThrow();
    });
  });

  describe('getByDate', () => {
    it('should return puzzle for existing date', async () => {
      const puzzleData = {
        date: '2024-01-01',
        articles: mockPuzzleArticles
      };
      
      await repository.create(puzzleData);
      const puzzle = await repository.getByDate('2024-01-01');
      
      expect(puzzle).not.toBeNull();
      expect(puzzle!.date).toBe('2024-01-01');
      expect(puzzle!.articles).toEqual(mockPuzzleArticles);
    });

    it('should return null for non-existing date', async () => {
      const puzzle = await repository.getByDate('2024-12-31');
      expect(puzzle).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing puzzle', async () => {
      const puzzleData = {
        date: '2024-01-01',
        articles: mockPuzzleArticles
      };
      
      await repository.create(puzzleData);
      const exists = await repository.exists('2024-01-01');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existing puzzle', async () => {
      const exists = await repository.exists('2024-12-31');
      expect(exists).toBe(false);
    });
  });
});