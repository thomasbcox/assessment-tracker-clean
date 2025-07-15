import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentTemplates, assessmentTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const templates = await db
      .select({
        id: assessmentTemplates.id,
        name: assessmentTemplates.name,
        version: assessmentTemplates.version,
        description: assessmentTemplates.description,
        assessmentTypeId: assessmentTemplates.assessmentTypeId,
        assessmentTypeName: assessmentTypes.name,
        isActive: assessmentTemplates.isActive,
        createdAt: assessmentTemplates.createdAt,
      })
      .from(assessmentTemplates)
      .innerJoin(assessmentTypes, eq(assessmentTemplates.assessmentTypeId, assessmentTypes.id))
      .where(eq(assessmentTemplates.isActive, 1));

    return NextResponse.json(templates);
  } catch (error) {
    logger.dbError('fetch assessment templates', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 