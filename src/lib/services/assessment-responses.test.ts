import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AssessmentResponsesService } from './assessment-responses';
import { db, assessmentResponses } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { CreateResponseInput, UpdateResponseInput, AssessmentResponse } from '@/lib/types/service-interfaces';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  assessmentResponses: {
    id: 'id',
    userId: 'userId',
    instanceId: 'instanceId',
    questionId: 'questionId',
    answer: 'answer',
    score: 'score',
    createdAt: 'createdAt'
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('AssessmentResponsesService', () => {
  const mockResponse: AssessmentResponse = {
    id: 1,
    userId: 'user123',
    instanceId: 1,
    questionId: 1,
    answer: 'This is my answer',
    score: 85,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockCreateInput: CreateResponseInput = {
    userId: 'user123',
    instanceId: 1,
    questionId: 1,
    answer: 'This is my answer',
    score: 85
  };

  const mockUpdateInput: UpdateResponseInput = {
    answer: 'Updated answer',
    score: 90
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createResponse', () => {
    it('should create a response successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockResponse])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await AssessmentResponsesService.createResponse(mockCreateInput);

      expect(mockDb.insert).toHaveBeenCalledWith(assessmentResponses);
      expect(mockInsert.values).toHaveBeenCalledWith(mockCreateInput);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error if required fields are missing', async () => {
      const invalidInput = { ...mockCreateInput, answer: '' };

      await expect(AssessmentResponsesService.createResponse(invalidInput))
        .rejects.toThrow('Answer is required');
    });
  });

  describe('getResponseById', () => {
    it('should return response by id', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockResponse])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentResponsesService.getResponseById(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return null if response not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentResponsesService.getResponseById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateResponse', () => {
    it('should update response successfully', async () => {
      const updatedResponse = { ...mockResponse, ...mockUpdateInput };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedResponse])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AssessmentResponsesService.updateResponse(1, mockUpdateInput);

      expect(mockDb.update).toHaveBeenCalledWith(assessmentResponses);
      expect(result).toEqual(updatedResponse);
    });

    it('should throw error if response not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      await expect(AssessmentResponsesService.updateResponse(999, mockUpdateInput))
        .rejects.toThrow('Response not found');
    });
  });

  describe('deleteResponse', () => {
    it('should delete response successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockResponse])
      });
      (mockDb.delete as jest.Mock).mockReturnValue(mockDelete);

      await AssessmentResponsesService.deleteResponse(1);

      expect(mockDb.delete).toHaveBeenCalledWith(assessmentResponses);
      expect(mockDelete.where).toHaveBeenCalledWith(eq(assessmentResponses.id, 1));
    });
  });

  describe('getResponsesByInstance', () => {
    it('should return responses by instance id', async () => {
      const mockResponses = [mockResponse, { ...mockResponse, id: 2, questionId: 2 }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockResponses)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentResponsesService.getResponsesByInstance(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockResponses);
    });
  });

  describe('getResponsesByUser', () => {
    it('should return responses by user id', async () => {
      const mockResponses = [mockResponse, { ...mockResponse, id: 2, instanceId: 2 }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockResponses)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentResponsesService.getResponsesByUser('user123');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockResponses);
    });
  });

  describe('getResponsesByQuestion', () => {
    it('should return responses by question id', async () => {
      const mockResponses = [mockResponse, { ...mockResponse, id: 2, userId: 'user456' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockResponses)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentResponsesService.getResponsesByQuestion(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockResponses);
    });
  });

  describe('submitResponse', () => {
    it('should submit response successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockResponse])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await AssessmentResponsesService.submitResponse(mockCreateInput);

      expect(mockDb.insert).toHaveBeenCalledWith(assessmentResponses);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getInstanceScore', () => {
    it('should calculate instance score correctly', async () => {
      const mockResponses = [
        { ...mockResponse, score: 85 },
        { ...mockResponse, id: 2, score: 90 },
        { ...mockResponse, id: 3, score: 95 }
      ];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockResponses)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentResponsesService.getInstanceScore(1);

      // Average of 85, 90, 95 = 90
      expect(result).toBe(90);
    });

    it('should return 0 if no responses found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentResponsesService.getInstanceScore(1);

      expect(result).toBe(0);
    });
  });

  describe('validateResponseData', () => {
    it('should validate valid response data', () => {
      const result = AssessmentResponsesService.validateResponseData(mockCreateInput);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty answer', () => {
      const invalidInput = { ...mockCreateInput, answer: '' };
      const result = AssessmentResponsesService.validateResponseData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Answer is required');
    });

    it('should reject invalid score range', () => {
      const invalidInput = { ...mockCreateInput, score: 150 };
      const result = AssessmentResponsesService.validateResponseData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Score must be between 0 and 100');
    });
  });
}); 