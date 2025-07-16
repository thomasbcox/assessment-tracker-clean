import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AssessmentQuestionsService } from './assessment-questions';
import { db, assessmentQuestions, assessmentTemplates, assessmentCategories } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  assessmentQuestions: {
    id: 'id',
    templateId: 'templateId',
    categoryId: 'categoryId',
    questionText: 'questionText',
    questionType: 'questionType',
    options: 'options',
    isRequired: 'isRequired',
    isActive: 'isActive',
    createdAt: 'createdAt'
  },
  assessmentTemplates: {
    id: 'id',
    name: 'name',
    description: 'description',
    isActive: 'isActive',
    createdAt: 'createdAt'
  },
  assessmentCategories: {
    id: 'id',
    name: 'name',
    description: 'description',
    isActive: 'isActive',
    createdAt: 'createdAt'
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('AssessmentQuestionsService', () => {
  const mockQuestion = {
    id: 1,
    templateId: 1,
    categoryId: 1,
    questionText: 'How would you rate your leadership skills?',
    questionType: 'rating',
    options: '["1","2","3","4","5"]',
    isRequired: 1,
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockTemplate = {
    id: 1,
    name: 'Leadership Assessment',
    description: 'Assessment for leadership skills',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockCategory = {
    id: 1,
    name: 'Leadership',
    description: 'Leadership questions',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuestion', () => {
    it('should create question successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockQuestion])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await AssessmentQuestionsService.createQuestion({
        templateId: 1,
        categoryId: 1,
        questionText: 'How would you rate your leadership skills?',
        questionType: 'rating',
        options: ['1', '2', '3', '4', '5'],
        isRequired: true
      });

      expect(mockDb.insert).toHaveBeenCalledWith(assessmentQuestions);
      expect(result).toEqual(mockQuestion);
    });

    it('should throw error if template not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([])
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(AssessmentQuestionsService.createQuestion({
        templateId: 999,
        categoryId: 1,
        questionText: 'Test question',
        questionType: 'text'
      })).rejects.toThrow('Assessment template not found');
    });

    it('should throw error if category not found', async () => {
      // Mock template exists
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          where: jest.fn().mockResolvedValue([mockTemplate])
        })
        .mockReturnValueOnce({
          where: jest.fn().mockResolvedValue([])
        });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(AssessmentQuestionsService.createQuestion({
        templateId: 1,
        categoryId: 999,
        questionText: 'Test question',
        questionType: 'text'
      })).rejects.toThrow('Assessment category not found');
    });
  });

  describe('getQuestionById', () => {
    it('should return question by id', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockQuestion])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentQuestionsService.getQuestionById(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockQuestion);
    });

    it('should return null if question not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentQuestionsService.getQuestionById(999);

      expect(result).toBeNull();
    });
  });

  describe('getQuestionsByTemplate', () => {
    it('should return questions by template', async () => {
      const mockQuestions = [mockQuestion, { ...mockQuestion, id: 2, questionText: 'Second question' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockQuestions)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentQuestionsService.getQuestionsByTemplate(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should return questions by category', async () => {
      const mockQuestions = [mockQuestion, { ...mockQuestion, id: 2, templateId: 2 }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockQuestions)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentQuestionsService.getQuestionsByCategory(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      const updatedQuestion = { ...mockQuestion, questionText: 'Updated question text' };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedQuestion])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AssessmentQuestionsService.updateQuestion(1, {
        questionText: 'Updated question text'
      });

      expect(mockDb.update).toHaveBeenCalledWith(assessmentQuestions);
      expect(result).toEqual(updatedQuestion);
    });

    it('should throw error if question not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      await expect(AssessmentQuestionsService.updateQuestion(999, {
        questionText: 'Updated question text'
      })).rejects.toThrow('Question not found');
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockQuestion])
      });
      (mockDb.delete as jest.Mock).mockReturnValue(mockDelete);

      await AssessmentQuestionsService.deleteQuestion(1);

      expect(mockDb.delete).toHaveBeenCalledWith(assessmentQuestions);
    });
  });

  describe('activateQuestion', () => {
    it('should activate question successfully', async () => {
      const activatedQuestion = { ...mockQuestion, isActive: 1 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([activatedQuestion])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AssessmentQuestionsService.activateQuestion(1);

      expect(mockDb.update).toHaveBeenCalledWith(assessmentQuestions);
      expect(result).toEqual(activatedQuestion);
    });
  });

  describe('deactivateQuestion', () => {
    it('should deactivate question successfully', async () => {
      const deactivatedQuestion = { ...mockQuestion, isActive: 0 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([deactivatedQuestion])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AssessmentQuestionsService.deactivateQuestion(1);

      expect(mockDb.update).toHaveBeenCalledWith(assessmentQuestions);
      expect(result).toEqual(deactivatedQuestion);
    });
  });

  describe('getActiveQuestions', () => {
    it('should return active questions', async () => {
      const mockQuestions = [mockQuestion, { ...mockQuestion, id: 2, questionText: 'Second question' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockQuestions)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentQuestionsService.getActiveQuestions();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('validateQuestionData', () => {
    it('should validate valid question data', () => {
      const result = AssessmentQuestionsService.validateQuestionData({
        templateId: 1,
        categoryId: 1,
        questionText: 'Test question',
        questionType: 'text'
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty question text', () => {
      const result = AssessmentQuestionsService.validateQuestionData({
        templateId: 1,
        categoryId: 1,
        questionText: '',
        questionType: 'text'
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Question text is required');
    });

    it('should reject invalid question type', () => {
      const result = AssessmentQuestionsService.validateQuestionData({
        templateId: 1,
        categoryId: 1,
        questionText: 'Test question',
        questionType: 'invalid' as any
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid question type');
    });

    it('should reject multiple choice without options', () => {
      const result = AssessmentQuestionsService.validateQuestionData({
        templateId: 1,
        categoryId: 1,
        questionText: 'Test question',
        questionType: 'multiple_choice'
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Options are required for multiple choice questions');
    });
  });
}); 