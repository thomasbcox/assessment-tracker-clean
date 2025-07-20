import { db, assessmentTypes, type AssessmentType } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function getActiveAssessmentTypes(): Promise<AssessmentType[]> {
  try {
    const types = await db
      .select()
      .from(assessmentTypes)
      .where(eq(assessmentTypes.isActive, 1));

    return types;
  } catch (error) {
    logger.dbError('fetch assessment types', error as Error);
    throw new Error('Failed to fetch assessment types');
  }
}

export async function createAssessmentType(data: {
  name: string;
  description?: string;
  purpose?: string;
}): Promise<AssessmentType> {
  try {
    const [newType] = await db.insert(assessmentTypes).values({
      ...data,
      isActive: 1,
    }).returning();

    return newType;
  } catch (error) {
    logger.dbError('create assessment type', error as Error);
    throw new Error('Failed to create assessment type');
  }
}

export async function getTypeById(id: number): Promise<AssessmentType | null> {
  try {
    const [type] = await db.select().from(assessmentTypes).where(eq(assessmentTypes.id, id)).limit(1);
    return type || null;
  } catch (error) {
    logger.dbError('fetch assessment type by id', error as Error, { id });
    throw error;
  }
}

export async function updateType(id: number, data: {
  name?: string;
  description?: string;
  purpose?: string;
  isActive?: number;
}): Promise<AssessmentType> {
  try {
    const [updated] = await db.update(assessmentTypes)
      .set(data)
      .where(eq(assessmentTypes.id, id))
      .returning();

    if (!updated) throw new Error('Assessment type not found');
    return updated;
  } catch (error) {
    logger.dbError('update assessment type', error as Error, { id, data });
    throw error;
  }
}

export async function deleteType(id: number): Promise<void> {
  try {
    // Check for child categories
    const { assessmentCategories } = await import('@/lib/db');
    const categories = await db.select().from(assessmentCategories)
      .where(eq(assessmentCategories.assessmentTypeId, id))
      .limit(1);
    
    if (categories.length > 0) {
      throw new ServiceError(
        `Cannot delete assessment type: ${categories.length} category(ies) are associated with this type. Please remove or reassign the categories first.`,
        'TYPE_HAS_CATEGORIES',
        400,
        { categoryCount: categories.length }
      );
    }
    
    // Check for child templates
    const { assessmentTemplates } = await import('@/lib/db');
    const templates = await db.select().from(assessmentTemplates)
      .where(eq(assessmentTemplates.assessmentTypeId, id))
      .limit(1);
    
    if (templates.length > 0) {
      throw new ServiceError(
        `Cannot delete assessment type: ${templates.length} template(s) are associated with this type. Please remove or reassign the templates first.`,
        'TYPE_HAS_TEMPLATES',
        400,
        { templateCount: templates.length }
      );
    }
    
    // Safe to delete - no child dependencies
    await db.delete(assessmentTypes).where(eq(assessmentTypes.id, id));
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error; // Re-throw business errors
    }
    logger.dbError('delete assessment type', error as Error, { id });
    throw new ServiceError('Failed to delete assessment type', 'DELETE_FAILED', 500);
  }
} 