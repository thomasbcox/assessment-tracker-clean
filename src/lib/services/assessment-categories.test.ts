import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AssessmentCategoriesService } from './assessment-categories';
import { db, assessmentCategories } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { CreateCategoryInput, UpdateCategoryInput, AssessmentCategory } from '@/lib/types/service-interfaces';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
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

describe('AssessmentCategoriesService', () => {
  const mockCategory: AssessmentCategory = {
    id: 1,
    name: 'Leadership',
    description: 'Leadership assessment questions',
    isActive: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockCreateInput: CreateCategoryInput = {
    name: 'Leadership',
    description: 'Leadership assessment questions'
  };

  const mockUpdateInput: UpdateCategoryInput = {
    name: 'Leadership Updated',
    description: 'Updated leadership questions'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCategory])
        })
      });
      (mockDb.insert as jest.Mock).mockReturnValue(mockInsert);

      const result = await AssessmentCategoriesService.createCategory(mockCreateInput);

      expect(mockDb.insert).toHaveBeenCalledWith(assessmentCategories);
      expect(mockInsert.values).toHaveBeenCalledWith({
        ...mockCreateInput,
        isActive: 1
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw error if category with same name exists', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockCategory])
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(AssessmentCategoriesService.createCategory(mockCreateInput))
        .rejects.toThrow('Category with this name already exists');
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockCategory])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentCategoriesService.getCategoryById(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentCategoriesService.getCategoryById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updatedCategory = { ...mockCategory, ...mockUpdateInput };
      
      // Mock getCategoryById to return existing category
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockCategory])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedCategory])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AssessmentCategoriesService.updateCategory(1, mockUpdateInput);

      expect(mockDb.update).toHaveBeenCalledWith(assessmentCategories);
      expect(result).toEqual(updatedCategory);
    });

    it('should throw error if category not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(AssessmentCategoriesService.updateCategory(999, mockUpdateInput))
        .rejects.toThrow('Category not found');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([mockCategory])
      });
      (mockDb.delete as jest.Mock).mockReturnValue(mockDelete);

      await AssessmentCategoriesService.deleteCategory(1);

      expect(mockDb.delete).toHaveBeenCalledWith(assessmentCategories);
      expect(mockDelete.where).toHaveBeenCalledWith(eq(assessmentCategories.id, 1));
    });

    it('should throw error if category not found', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([])
      });
      (mockDb.delete as jest.Mock).mockReturnValue(mockDelete);

      await expect(AssessmentCategoriesService.deleteCategory(999))
        .rejects.toThrow('Category not found');
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [mockCategory, { ...mockCategory, id: 2, name: 'Communication' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(mockCategories)
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentCategoriesService.getAllCategories();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getActiveCategories', () => {
    it('should return active categories', async () => {
      const mockCategories = [mockCategory, { ...mockCategory, id: 2, name: 'Communication' }];
      
      const mockSelect = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockCategories)
        })
      });
      (mockDb.select as jest.Mock).mockReturnValue(mockSelect);

      const result = await AssessmentCategoriesService.getActiveCategories();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('activateCategory', () => {
    it('should activate category successfully', async () => {
      const activatedCategory = { ...mockCategory, isActive: 1 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([activatedCategory])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AssessmentCategoriesService.activateCategory(1);

      expect(mockDb.update).toHaveBeenCalledWith(assessmentCategories);
      expect(result).toEqual(activatedCategory);
    });
  });

  describe('deactivateCategory', () => {
    it('should deactivate category successfully', async () => {
      const deactivatedCategory = { ...mockCategory, isActive: 0 };
      
      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([deactivatedCategory])
          })
        })
      });
      (mockDb.update as jest.Mock).mockReturnValue(mockUpdate);

      const result = await AssessmentCategoriesService.deactivateCategory(1);

      expect(mockDb.update).toHaveBeenCalledWith(assessmentCategories);
      expect(result).toEqual(deactivatedCategory);
    });
  });

  describe('validateCategoryData', () => {
    it('should validate valid category data', () => {
      const result = AssessmentCategoriesService.validateCategoryData(mockCreateInput);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty name', () => {
      const invalidInput = { ...mockCreateInput, name: '' };
      const result = AssessmentCategoriesService.validateCategoryData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    it('should reject name that is too short', () => {
      const invalidInput = { ...mockCreateInput, name: 'A' };
      const result = AssessmentCategoriesService.validateCategoryData(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Name must be at least 2 characters');
    });
  });
}); 