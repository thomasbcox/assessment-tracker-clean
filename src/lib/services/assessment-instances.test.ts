import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AssessmentInstancesService } from './assessment-instances';
import { db, assessmentInstances, users, assessmentTemplates, assessmentPeriods } from '@/lib/db';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/logger');

const mockDb = db as jest.Mocked<typeof db>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AssessmentInstancesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createInstance', () => {
    it('should create a new instance successfully', async () => {
      const instanceData = {
        userId: 'user1',
        templateId: 1,
        periodId: 1,
        status: 'assigned' as const
      };

      const mockInstance = {
        id: 1,
        ...instanceData,
        score: null,
        completedAt: null,
        createdAt: '2024-01-01T00:00:00Z'
      };

      // Mock user check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user1', email: 'test@example.com' }])
          })
        })
      } as any);

      // Mock template check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Template' }])
          })
        })
      } as any);

      // Mock period check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Q1 2024' }])
          })
        })
      } as any);

      // Mock duplicate check
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      // Mock insert
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockInstance])
        })
      } as any);

      const result = await AssessmentInstancesService.createInstance(instanceData);

      expect(result).toEqual(mockInstance);
      expect(mockDb.insert).toHaveBeenCalledWith(assessmentInstances);
    });

    it('should throw error for invalid user', async () => {
      const instanceData = {
        userId: 'nonexistent',
        templateId: 1,
        periodId: 1,
        status: 'assigned' as const
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await expect(AssessmentInstancesService.createInstance(instanceData))
        .rejects.toThrow('User not found');
    });

    it('should throw error for invalid template', async () => {
      const instanceData = {
        userId: 'user1',
        templateId: 999,
        periodId: 1,
        status: 'assigned' as const
      };

      // Mock user check - return valid user
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user1', email: 'test@example.com' }])
          })
        })
      } as any);

      // Mock template check - return empty
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await expect(AssessmentInstancesService.createInstance(instanceData))
        .rejects.toThrow('Assessment template not found');
    });

    it('should throw error for invalid period', async () => {
      const instanceData = {
        userId: 'user1',
        templateId: 1,
        periodId: 999,
        status: 'assigned' as const
      };

      // Mock user check - return valid user
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user1', email: 'test@example.com' }])
          })
        })
      } as any);

      // Mock template check - return valid template
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Template' }])
          })
        })
      } as any);

      // Mock period check - return empty
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await expect(AssessmentInstancesService.createInstance(instanceData))
        .rejects.toThrow('Assessment period not found');
    });

    it('should throw error for duplicate instance', async () => {
      const instanceData = {
        userId: 'user1',
        templateId: 1,
        periodId: 1,
        status: 'assigned' as const
      };

      // Mock user check - return valid user
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'user1', email: 'test@example.com' }])
          })
        })
      } as any);

      // Mock template check - return valid template
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Test Template' }])
          })
        })
      } as any);

      // Mock period check - return valid period
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, name: 'Q1 2024' }])
          })
        })
      } as any);

      // Mock duplicate check - return existing instance
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 1, userId: 'user1', templateId: 1, periodId: 1 }])
          })
        })
      } as any);

      await expect(AssessmentInstancesService.createInstance(instanceData))
        .rejects.toThrow('Assessment instance already exists for this user, template, and period');
    });
  });

  describe('getInstanceById', () => {
    it('should return instance when found', async () => {
      const mockInstance = {
        id: 1,
        userId: 'user1',
        templateId: 1,
        periodId: 1,
        status: 'assigned',
        score: null,
        completedAt: null,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockInstance])
          })
        })
      } as any);

      const result = await AssessmentInstancesService.getInstanceById(1);

      expect(result).toEqual(mockInstance);
    });

    it('should return null when instance not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      const result = await AssessmentInstancesService.getInstanceById(999);

      expect(result).toBeNull();
    });
  });

  describe('getInstancesByUser', () => {
    it('should return instances for specific user', async () => {
      const mockInstances = [
        {
          id: 1,
          userId: 'user1',
          templateId: 1,
          periodId: 1,
          status: 'assigned',
          score: null,
          completedAt: null,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          userId: 'user1',
          templateId: 2,
          periodId: 1,
          status: 'completed',
          score: 85,
          completedAt: '2024-01-02T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockInstances)
          })
        })
      } as any);

      const result = await AssessmentInstancesService.getInstancesByUser('user1');

      expect(result).toEqual(mockInstances);
    });
  });

  describe('getInstancesByStatus', () => {
    it('should return instances with specific status', async () => {
      const mockInstances = [
        {
          id: 1,
          userId: 'user1',
          templateId: 1,
          periodId: 1,
          status: 'completed',
          score: 85,
          completedAt: '2024-01-02T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockInstances)
          })
        })
      } as any);

      const result = await AssessmentInstancesService.getInstancesByStatus('completed');

      expect(result).toEqual(mockInstances);
    });
  });

  describe('updateInstance', () => {
    it('should update instance successfully', async () => {
      const updateData = {
        status: 'completed' as const,
        score: 85,
        completedAt: '2024-01-02T00:00:00Z'
      };

      const mockInstance = {
        id: 1,
        userId: 'user1',
        templateId: 1,
        periodId: 1,
        status: 'completed',
        score: 85,
        completedAt: '2024-01-02T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z'
      };

      // Mock getInstanceById to return existing instance
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockInstance])
          })
        })
      } as any);

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockInstance])
          })
        })
      } as any);

      const result = await AssessmentInstancesService.updateInstance(1, updateData);

      expect(result).toEqual(mockInstance);
    });

    it('should throw error when instance not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      await expect(AssessmentInstancesService.updateInstance(999, { status: 'completed' }))
        .rejects.toThrow('Assessment instance not found');
    });
  });

  describe('deleteInstance', () => {
    it('should delete instance successfully', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      } as any);

      await expect(AssessmentInstancesService.deleteInstance(1)).resolves.toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalledWith(assessmentInstances);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.delete.mockImplementation(() => {
        throw error;
      });

      await expect(AssessmentInstancesService.deleteInstance(1)).rejects.toThrow('Database error');
      expect(mockLogger.dbError).toHaveBeenCalledWith('delete assessment instance', error, { id: 1 });
    });
  });

  describe('getInstancesByPeriod', () => {
    it('should return instances for specific period', async () => {
      const mockInstances = [
        {
          id: 1,
          userId: 'user1',
          templateId: 1,
          periodId: 1,
          status: 'assigned',
          score: null,
          completedAt: null,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockInstances)
          })
        })
      } as any);

      const result = await AssessmentInstancesService.getInstancesByPeriod(1);

      expect(result).toEqual(mockInstances);
    });
  });

  describe('getInstancesByTemplate', () => {
    it('should return instances for specific template', async () => {
      const mockInstances = [
        {
          id: 1,
          userId: 'user1',
          templateId: 1,
          periodId: 1,
          status: 'assigned',
          score: null,
          completedAt: null,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockInstances)
          })
        })
      } as any);

      const result = await AssessmentInstancesService.getInstancesByTemplate(1);

      expect(result).toEqual(mockInstances);
    });
  });

  describe('validateInstanceData', () => {
    it('should validate instance data successfully', () => {
      const validData = {
        userId: 'user1',
        templateId: 1,
        periodId: 1,
        status: 'assigned' as const
      };

      const result = AssessmentInstancesService.validateInstanceData(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for missing userId', () => {
      const invalidData = {
        templateId: 1,
        periodId: 1,
        status: 'assigned' as const
      };

      const result = AssessmentInstancesService.validateInstanceData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return error for missing templateId', () => {
      const invalidData = {
        userId: 'user1',
        periodId: 1,
        status: 'assigned' as const
      };

      const result = AssessmentInstancesService.validateInstanceData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Template ID is required');
    });

    it('should return error for missing periodId', () => {
      const invalidData = {
        userId: 'user1',
        templateId: 1,
        status: 'assigned' as const
      };

      const result = AssessmentInstancesService.validateInstanceData(invalidData as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Period ID is required');
    });

    it('should return error for invalid status', () => {
      const invalidData = {
        userId: 'user1',
        templateId: 1,
        periodId: 1,
        status: 'invalid' as any
      };

      const result = AssessmentInstancesService.validateInstanceData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid status. Must be one of: assigned, in_progress, completed, abandoned');
    });
  });
}); 