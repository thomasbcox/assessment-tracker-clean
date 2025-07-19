import { db, assessmentTypes, type AssessmentType } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

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
    await db.delete(assessmentTypes).where(eq(assessmentTypes.id, id));
  } catch (error) {
    logger.dbError('delete assessment type', error as Error, { id });
    throw error;
  }
} 