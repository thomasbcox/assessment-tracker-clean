import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanup } from '../test-utils-clean';
import { AssessmentCategoriesService } from './assessment-categories';
import { createAssessmentType } from './assessment-types';

describe('Assessment Categories Service', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('createCategory', () => {
    it('should create a category with valid data', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const categoryData = {
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        description: 'Test description',
        displayOrder: 1
      };

      const category = await AssessmentCategoriesService.createCategory(categoryData);

      expect(category).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBe(categoryData.description);
      expect(category.displayOrder).toBe(categoryData.displayOrder);
      expect(category.isActive).toBe(1);
    });

    it('should create a category without description', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const categoryData = {
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      };

      const category = await AssessmentCategoriesService.createCategory(categoryData);

      expect(category).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBeNull();
    });

    it('should throw error for duplicate name within same assessment type', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const categoryData = {
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      };

      await AssessmentCategoriesService.createCategory(categoryData);

      await expect(AssessmentCategoriesService.createCategory(categoryData)).rejects.toThrow();
    });

    it('should throw error for missing required fields', async () => {
      const categoryData = {
        name: 'Test Category'
        // Missing assessmentTypeId and displayOrder
      };

      await expect(AssessmentCategoriesService.createCategory(categoryData as any)).rejects.toThrow();
    });

    it('should throw error for non-existent assessment type', async () => {
      const categoryData = {
        assessmentTypeId: 999,
        name: 'Test Category',
        displayOrder: 1
      };

      await expect(AssessmentCategoriesService.createCategory(categoryData)).rejects.toThrow();
    });
  });

  describe('getCategoryById', () => {
    it('should return category by ID', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const categoryData = {
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      };

      const createdCategory = await AssessmentCategoriesService.createCategory(categoryData);
      const category = await AssessmentCategoriesService.getCategoryById(createdCategory.id);

      expect(category).toBeDefined();
      expect(category?.id).toBe(createdCategory.id);
      expect(category?.name).toBe(categoryData.name);
    });

    it('should return null for non-existent category', async () => {
      const category = await AssessmentCategoriesService.getCategoryById(999);

      expect(category).toBeNull();
    });
  });

  describe('getActiveCategories', () => {
    it('should return all active categories', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Category 1',
        displayOrder: 1
      });
      await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Category 2',
        displayOrder: 2
      });

      const categories = await AssessmentCategoriesService.getActiveCategories();

      expect(categories).toHaveLength(2);
      expect(categories.some(c => c.name === 'Category 1')).toBe(true);
      expect(categories.some(c => c.name === 'Category 2')).toBe(true);
    });

    it('should return empty array when no categories exist', async () => {
      const categories = await AssessmentCategoriesService.getActiveCategories();

      expect(categories).toHaveLength(0);
    });
  });

  describe('getCategoriesByType', () => {
    it('should return categories for specific assessment type', async () => {
      const type1 = await createAssessmentType({ name: 'Type 1' });
      const type2 = await createAssessmentType({ name: 'Type 2' });
      
      await AssessmentCategoriesService.createCategory({
        assessmentTypeId: type1.id,
        name: 'Category 1',
        displayOrder: 1
      });
      await AssessmentCategoriesService.createCategory({
        assessmentTypeId: type2.id,
        name: 'Category 2',
        displayOrder: 1
      });

      const categories = await AssessmentCategoriesService.getCategoriesByType(type1.id);

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Category 1');
    });
  });

  describe('updateCategory', () => {
    it('should update category with valid data', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const categoryData = {
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      };

      const createdCategory = await AssessmentCategoriesService.createCategory(categoryData);

      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
        displayOrder: 2
      };

      const updatedCategory = await AssessmentCategoriesService.updateCategory(createdCategory.id, updateData);

      expect(updatedCategory.name).toBe(updateData.name);
      expect(updatedCategory.description).toBe(updateData.description);
      expect(updatedCategory.displayOrder).toBe(updateData.displayOrder);
    });

    it('should throw error for non-existent category', async () => {
      await expect(AssessmentCategoriesService.updateCategory(999, { name: 'Test' })).rejects.toThrow();
    });

    it('should throw error for duplicate name within same assessment type', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Category 1',
        displayOrder: 1
      });
      const category2 = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Category 2',
        displayOrder: 2
      });

      await expect(AssessmentCategoriesService.updateCategory(category2.id, { name: 'Category 1' })).rejects.toThrow();
    });
  });

  describe('deactivateCategory', () => {
    it('should deactivate category', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const categoryData = {
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      };

      const createdCategory = await AssessmentCategoriesService.createCategory(categoryData);
      const deactivatedCategory = await AssessmentCategoriesService.deactivateCategory(createdCategory.id);

      expect(deactivatedCategory.isActive).toBe(0);
    });

    it('should throw error for non-existent category', async () => {
      await expect(AssessmentCategoriesService.deactivateCategory(999)).rejects.toThrow();
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const categoryData = {
        assessmentTypeId: assessmentType.id,
        name: 'Test Category',
        displayOrder: 1
      };

      const createdCategory = await AssessmentCategoriesService.createCategory(categoryData);
      await AssessmentCategoriesService.deleteCategory(createdCategory.id);

      const category = await AssessmentCategoriesService.getCategoryById(createdCategory.id);
      expect(category).toBeNull();
    });
  });

  describe('reorderCategories', () => {
    it('should reorder categories correctly', async () => {
      const assessmentType = await createAssessmentType({ name: 'Test Type' });
      
      const category1 = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Category 1',
        displayOrder: 1
      });
      const category2 = await AssessmentCategoriesService.createCategory({
        assessmentTypeId: assessmentType.id,
        name: 'Category 2',
        displayOrder: 2
      });

      const categoryOrders = [
        { id: category1.id, displayOrder: 3 },
        { id: category2.id, displayOrder: 1 }
      ];

      const reorderedCategories = await AssessmentCategoriesService.reorderCategories(assessmentType.id, categoryOrders);

      expect(reorderedCategories).toHaveLength(2);
      expect(reorderedCategories.find(c => c.id === category1.id)?.displayOrder).toBe(3);
      expect(reorderedCategories.find(c => c.id === category2.id)?.displayOrder).toBe(1);
    });
  });
}); 