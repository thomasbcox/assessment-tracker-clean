import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getActiveAssessmentTypes, createAssessmentType } from './assessment-types';
import { db, assessmentTypes } from '../db';

// Mock the database
jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn()
  },
  assessmentTypes: {
    id: 'id',
    name: 'name',
    description: 'description',
    isActive: 'isActive',
    createdAt: 'createdAt'
  }
}));

// Mock the logger
jest.mock('../logger', () => ({
  logger: {
    dbError: jest.fn()
  }
}));

describe('AssessmentTypes Service', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const mockLogger = require('../logger').logger;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveAssessmentTypes', () => {
    it('should return active assessment types', async () => {
      const mockTypes = [
        {
          id: 1,
          name: 'Leadership Assessment',
          description: 'Assessment for leadership skills',
          isActive: 1,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Communication Assessment',
          description: 'Assessment for communication skills',
          isActive: 1,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockTypes)
        })
      } as any);

      const result = await getActiveAssessmentTypes();

      expect(result).toEqual(mockTypes);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.select.mockImplementation(() => {
        throw error;
      });

      await expect(getActiveAssessmentTypes()).rejects.toThrow('Failed to fetch assessment types');
    });
  });

  describe('createAssessmentType', () => {
    it('should create assessment type successfully', async () => {
      const mockType = {
        id: 1,
        name: 'Leadership Assessment',
        description: 'Assessment for leadership skills',
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockType])
        })
      } as any);

      const result = await createAssessmentType({
        name: 'Leadership Assessment',
        description: 'Assessment for leadership skills'
      });

      expect(result).toEqual(mockType);
      expect(mockDb.insert).toHaveBeenCalledWith(assessmentTypes);
    });

    it('should create assessment type without description', async () => {
      const mockType = {
        id: 1,
        name: 'Leadership Assessment',
        description: null,
        isActive: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockType])
        })
      } as any);

      const result = await createAssessmentType({
        name: 'Leadership Assessment'
      });

      expect(result).toEqual(mockType);
      expect(mockDb.insert).toHaveBeenCalledWith(assessmentTypes);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.insert.mockImplementation(() => {
        throw error;
      });

      await expect(createAssessmentType({
        name: 'Leadership Assessment'
      })).rejects.toThrow('Failed to create assessment type');
    });
  });
}); 