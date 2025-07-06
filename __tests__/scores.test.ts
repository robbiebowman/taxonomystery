import { ScoresRepository } from '../lib/db/scores';
import { cleanupDatabase, mockAnswers } from './test-utils';

describe('ScoresRepository', () => {
  let repository: ScoresRepository;
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(() => {
    repository = new ScoresRepository();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe('submitScore', () => {
    it('should submit a new score', async () => {
      const scoreData = {
        user_id: testUserId,
        puzzle_date: '2024-01-01',
        score: 8,
        answers: mockAnswers
      };
      
      const result = await repository.submitScore(scoreData);
      
      expect(result).toHaveProperty('id');
      expect(result.user_id).toBe(testUserId);
      expect(result.puzzle_date).toBe('2024-01-01');
      expect(result.score).toBe(8);
      expect(result.answers).toEqual(mockAnswers);
    });

    it('should update existing score for same user and date', async () => {
      const scoreData = {
        user_id: testUserId,
        puzzle_date: '2024-01-01',
        score: 5,
        answers: mockAnswers
      };
      
      await repository.submitScore(scoreData);
      
      const updatedData = {
        ...scoreData,
        score: 9,
        answers: [...mockAnswers, { guess: 'New Answer', correct: true, article_title: 'New Article' }]
      };
      
      const result = await repository.submitScore(updatedData);
      expect(result.score).toBe(9);
      expect(result.answers).toHaveLength(3);
    });
  });

  describe('getUserHistory', () => {
    it('should return user score history ordered by date', async () => {
      const scores = [
        {
          user_id: testUserId,
          puzzle_date: '2024-01-01',
          score: 7,
          answers: mockAnswers
        },
        {
          user_id: testUserId,
          puzzle_date: '2024-01-02',
          score: 9,
          answers: mockAnswers
        }
      ];
      
      for (const score of scores) {
        await repository.submitScore(score);
      }
      
      const history = await repository.getUserHistory(testUserId);
      
      expect(history).toHaveLength(2);
      expect(history[0].puzzle_date).toBe('2024-01-02'); // Most recent first
      expect(history[1].puzzle_date).toBe('2024-01-01');
    });

    it('should return empty array for user with no scores', async () => {
      const history = await repository.getUserHistory('non-existent-user');
      expect(history).toHaveLength(0);
    });
  });

  describe('getDistribution', () => {
    it('should return score distribution for a date', async () => {
      await repository.updateDistribution('2024-01-01', 5);
      await repository.updateDistribution('2024-01-01', 8);
      await repository.updateDistribution('2024-01-01', 5);
      
      const distribution = await repository.getDistribution('2024-01-01');
      
      expect(distribution).toHaveLength(2);
      expect(distribution.find(d => d.score === 5)?.count).toBe(2);
      expect(distribution.find(d => d.score === 8)?.count).toBe(1);
    });

    it('should return empty array for date with no scores', async () => {
      const distribution = await repository.getDistribution('2024-12-31');
      expect(distribution).toHaveLength(0);
    });
  });

  describe('updateDistribution', () => {
    it('should create new distribution entry', async () => {
      await repository.updateDistribution('2024-01-01', 7);
      
      const distribution = await repository.getDistribution('2024-01-01');
      expect(distribution).toHaveLength(1);
      expect(distribution[0].score).toBe(7);
      expect(distribution[0].count).toBe(1);
    });

    it('should increment existing distribution entry', async () => {
      await repository.updateDistribution('2024-01-01', 7);
      await repository.updateDistribution('2024-01-01', 7);
      
      const distribution = await repository.getDistribution('2024-01-01');
      expect(distribution).toHaveLength(1);
      expect(distribution[0].count).toBe(2);
    });
  });
});