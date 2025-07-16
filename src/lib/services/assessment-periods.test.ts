import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AssessmentPeriodsService } from './assessment-periods';
import { db, assessmentPeriods } from '@/lib/db';
import { eq, and, not } from 'drizzle-orm';
import { ServiceError } from '@/lib/types/service-interfaces';
import type { CreatePeriodInput, UpdatePeriodInput, AssessmentPeriod } from '@/lib/types/service-interfaces';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  assessmentPeriods: {
    id: 'id',
    name: 'name',
    startDate: 'startDate',
    endDate: 'endDate',
    isActive: 'isActive',
    createdAt: 'createdAt'
  }
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('AssessmentPeriodsService', () => {
  const mockPeriod: AssessmentPeriod = {
    id: 1,
    name: 'Q1 2024',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockCreateInput: CreatePeriodInput = {
    name: 'Q1 2024',
    startDate: '2024-01-01',
    endDate: '2024-03-31'
  };

  const mockUpdateInput: UpdatePeriodInput = {
    name: 'Q1 2024 Updated',
    endDate: '2024-04-30'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPeriod', () => {
    it('should create a period successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockPeriod])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await AssessmentPeriodsService.createPeriod(mockCreateInput);

      expect(mockDb.insert).toHaveBeenCalledWith(assessmentPeriods);
      expect(mockInsert.values).toHaveBeenCalledWith({
        ...mockCreateInput,
        isActive: 0
      });
      expect(result).toEqual(mockPeriod);
    });

    it('should throw error if period with same name exists', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockPeriod])
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(AssessmentPeriodsService.createPeriod(mockCreateInput))
        .rejects.toThrow('Period with this name already exists');
    });

    it('should throw error if start date is after end date', async () => {
      const invalidInput: CreatePeriodInput = {
        name: 'Invalid Period',
        startDate: '2024-12-01',
        endDate: '2024-01-01'
      };

      await expect(AssessmentPeriodsService.createPeriod(invalidInput))
        .rejects.toThrow('Start date must be before end date');
    });
  });

  describe('getPeriodById', () => {
    it('should return period by id', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockPeriod])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      const result = await AssessmentPeriodsService.getPeriodById(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockPeriod);
    });

    it('should return null if period not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      const result = await AssessmentPeriodsService.getPeriodById(999);

      expect(result).toBeNull();
    });
  });

  describe('updatePeriod', () => {
    it('should update period successfully', async () => {
      const updatedPeriod = { ...mockPeriod, ...mockUpdateInput };
      
      // Mock getPeriodById to return existing period
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockPeriod])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedPeriod])
          })
        })
      });
      mockDb.update.mockReturnValue(mockUpdate as any);

      const result = await AssessmentPeriodsService.updatePeriod(1, mockUpdateInput);

      expect(mockDb.update).toHaveBeenCalledWith(assessmentPeriods);
      expect(result).toEqual(updatedPeriod);
    });

    it('should throw error if period not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      await expect(AssessmentPeriodsService.updatePeriod(999, mockUpdateInput))
        .rejects.toThrow('Period not found');
    });

    it('should throw error if name conflicts with existing period', async () => {
      const conflictingPeriod = { ...mockPeriod, id: 2 };
      
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockPeriod])
          })
        })
        .mockReturnValueOnce({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([conflictingPeriod])
          })
        });
      mockDb.select.mockReturnValue(mockSelect as any);

      await expect(AssessmentPeriodsService.updatePeriod(1, { name: 'Conflicting Name' }))
        .rejects.toThrow('Period with this name already exists');
    });
  });

  describe('deletePeriod', () => {
    it('should delete period successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockPeriod])
      });
      mockDb.delete.mockReturnValue(mockDelete as any);

      await AssessmentPeriodsService.deletePeriod(1);

      expect(mockDb.delete).toHaveBeenCalledWith(assessmentPeriods);
      expect(mockDelete.where).toHaveBeenCalledWith(eq(assessmentPeriods.id, 1));
    });

    it('should throw error if period not found', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([])
      });
      mockDb.delete.mockReturnValue(mockDelete as any);

      await expect(AssessmentPeriodsService.deletePeriod(999))
        .rejects.toThrow('Period not found');
    });
  });

  describe('getAllPeriods', () => {
    it('should return all periods', async () => {
      const mockPeriods = [mockPeriod, { ...mockPeriod, id: 2, name: 'Q2 2024' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(mockPeriods)
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      const result = await AssessmentPeriodsService.getAllPeriods();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockPeriods);
    });
  });

  describe('getActivePeriod', () => {
    it('should return active period', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockPeriod])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      const result = await AssessmentPeriodsService.getActivePeriod();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockPeriod);
    });

    it('should return null if no active period', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      const result = await AssessmentPeriodsService.getActivePeriod();

      expect(result).toBeNull();
    });
  });

  describe('setActivePeriod', () => {
    it('should set period as active and deactivate others', async () => {
      // Mock getPeriodById to return existing period
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockPeriod])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...mockPeriod, isActive: 1 }])
          })
        })
      });
      mockDb.update.mockReturnValue(mockUpdate as any);

      const result = await AssessmentPeriodsService.setActivePeriod(1);

      expect(mockDb.update).toHaveBeenCalledTimes(2); // Deactivate all, then activate specific
      expect(result.isActive).toBe(1);
    });

    it('should throw error if period not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      mockDb.select.mockReturnValue(mockSelect as any);

      await expect(AssessmentPeriodsService.setActivePeriod(999))
        .rejects.toThrow('Period not found');
    });
  });

  describe('validatePeriodData', () => {
    it('should validate valid period data', () => {
      const result = AssessmentPeriodsService.validatePeriodData(mockCreateInput);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty name', () => {
      const invalidInput = { ...mockCreateInput, name: '' };
      const result = AssessmentPeriodsService.validatePeriodData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    it('should reject invalid date format', () => {
      const invalidInput = { ...mockCreateInput, startDate: 'invalid-date' };
      const result = AssessmentPeriodsService.validatePeriodData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    it('should reject start date after end date', () => {
      const invalidInput = {
        ...mockCreateInput,
        startDate: '2024-12-01',
        endDate: '2024-01-01'
      };
      const result = AssessmentPeriodsService.validatePeriodData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Start date must be before end date');
    });
  });
}); 