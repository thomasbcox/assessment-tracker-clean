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