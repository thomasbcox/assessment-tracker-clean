import { db, assessmentCategories, assessmentTypes } from '@/lib/db';
import { eq, and, ne } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { ServiceError } from '@/lib/types/service-interfaces';

export interface AssessmentCategoryData {
  assessmentTypeId: number;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface AssessmentCategory {
  id: number;
  assessmentTypeId: number;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: number;
  createdAt: string;
  assessmentTypeName?: string;
}

export class AssessmentCategoriesService {
  static async createCategory(data: AssessmentCategoryData): Promise<AssessmentCategory> {
    try {
      // Validate required fields
      if (!data.assessmentTypeId || !data.name || data.displayOrder === undefined) {
        throw new Error('Assessment type ID, name, and display order are required');
      }

      // Validate assessment type exists
      const [type] = await db.select().from(assessmentTypes).where(eq(assessmentTypes.id, data.assessmentTypeId)).limit(1);
      if (!type) throw new Error('Assessment type not found');

      // Check for duplicate name within the same assessment type
      const existing = await db.select().from(assessmentCategories)
        .where(and(
          eq(assessmentCategories.assessmentTypeId, data.assessmentTypeId),
          eq(assessmentCategories.name, data.name)
        ))
        .limit(1);
      if (existing.length > 0) throw new Error('Category with this name already exists for this assessment type');

      const [category] = await db.insert(assessmentCategories).values({
        assessmentTypeId: data.assessmentTypeId,
        name: data.name,
        description: data.description || null,
        displayOrder: data.displayOrder,
        isActive: 1,
      }).returning();

      return { ...category, createdAt: category.createdAt || '', isActive: category.isActive || 1 };
    } catch (error) {
      logger.dbError('create assessment category', error as Error, data);
      throw error;
    }
  }

  static async getCategoryById(id: number): Promise<AssessmentCategory | null> {
    try {
      const [category] = await db.select({
        id: assessmentCategories.id,
        assessmentTypeId: assessmentCategories.assessmentTypeId,
        name: assessmentCategories.name,
        description: assessmentCategories.description,
        displayOrder: assessmentCategories.displayOrder,
        isActive: assessmentCategories.isActive,
        createdAt: assessmentCategories.createdAt,
        assessmentTypeName: assessmentTypes.name,
      })
        .from(assessmentCategories)
        .leftJoin(assessmentTypes, eq(assessmentCategories.assessmentTypeId, assessmentTypes.id))
        .where(eq(assessmentCategories.id, id))
        .limit(1);
      
      if (!category) return null;
      return { 
        ...category, 
        createdAt: category.createdAt || '', 
        isActive: category.isActive || 1,
        assessmentTypeName: category.assessmentTypeName || undefined
      };
    } catch (error) {
      logger.dbError('fetch assessment category by id', error as Error, { id });
      throw error;
    }
  }

  static async getActiveCategories(): Promise<AssessmentCategory[]> {
    try {
      const categories = await db.select()
        .from(assessmentCategories)
        .where(eq(assessmentCategories.isActive, 1))
        .orderBy(assessmentCategories.displayOrder);
      
      return categories.map(category => ({ ...category, createdAt: category.createdAt || '', isActive: category.isActive || 1 }));
    } catch (error) {
      logger.dbError('fetch active categories', error as Error);
      throw error;
    }
  }

  static async getCategoriesByType(assessmentTypeId: number): Promise<AssessmentCategory[]> {
    try {
      const categories = await db.select()
        .from(assessmentCategories)
        .where(and(
          eq(assessmentCategories.assessmentTypeId, assessmentTypeId),
          eq(assessmentCategories.isActive, 1)
        ))
        .orderBy(assessmentCategories.displayOrder);
      
      return categories.map(category => ({ ...category, createdAt: category.createdAt || '', isActive: category.isActive || 1 }));
    } catch (error) {
      logger.dbError('fetch categories by type', error as Error, { assessmentTypeId });
      throw error;
    }
  }

  static async updateCategory(id: number, data: Partial<AssessmentCategoryData>): Promise<AssessmentCategory> {
    try {
      const existing = await this.getCategoryById(id);
      if (!existing) throw new Error('Assessment category not found');

      // Check for duplicate name if name is being updated
      if (data.name) {
        const duplicate = await db.select().from(assessmentCategories)
          .where(and(
            eq(assessmentCategories.assessmentTypeId, existing.assessmentTypeId),
            eq(assessmentCategories.name, data.name),
            ne(assessmentCategories.id, id)
          ))
          .limit(1);
        if (duplicate.length > 0) throw new Error('Category with this name already exists for this assessment type');
      }

      const [updated] = await db.update(assessmentCategories)
        .set({
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        })
        .where(eq(assessmentCategories.id, id))
        .returning();

      if (!updated) throw new Error('Failed to update assessment category');
      return { ...updated, createdAt: updated.createdAt || '', isActive: updated.isActive || 1 };
    } catch (error) {
      logger.dbError('update assessment category', error as Error, { id, data });
      throw error;
    }
  }

  static async deleteCategory(id: number): Promise<void> {
    try {
      // Check for child questions
      const { assessmentQuestions } = await import('@/lib/db');
      const questions = await db.select().from(assessmentQuestions)
        .where(eq(assessmentQuestions.categoryId, id))
        .limit(1);
      
      if (questions.length > 0) {
        throw new ServiceError(
          `Cannot delete category: ${questions.length} question(s) are associated with this category. Please remove or reassign the questions first.`,
          'CATEGORY_HAS_QUESTIONS',
          400,
          { questionCount: questions.length }
        );
      }
      
      // Safe to delete - no child dependencies
      await db.delete(assessmentCategories).where(eq(assessmentCategories.id, id));
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error; // Re-throw business errors
      }
      logger.dbError('delete assessment category', error as Error, { id });
      throw new ServiceError('Failed to delete assessment category', 'DELETE_FAILED', 500);
    }
  }

  static async deactivateCategory(id: number): Promise<AssessmentCategory> {
    try {
      const [deactivated] = await db.update(assessmentCategories)
        .set({ isActive: 0 })
        .where(eq(assessmentCategories.id, id))
        .returning();

      if (!deactivated) throw new Error('Assessment category not found');
      return { ...deactivated, createdAt: deactivated.createdAt || '', isActive: deactivated.isActive || 0 };
    } catch (error) {
      logger.dbError('deactivate assessment category', error as Error, { id });
      throw error;
    }
  }

  static async reorderCategories(assessmentTypeId: number, categoryOrders: { id: number; displayOrder: number }[]): Promise<AssessmentCategory[]> {
    try {
      // Update each category's display order
      for (const { id, displayOrder } of categoryOrders) {
        await db.update(assessmentCategories)
          .set({ displayOrder })
          .where(eq(assessmentCategories.id, id));
      }

      // Return updated categories
      return await this.getCategoriesByType(assessmentTypeId);
    } catch (error) {
      logger.dbError('reorder assessment categories', error as Error, { assessmentTypeId, categoryOrders });
      throw error;
    }
  }
} 