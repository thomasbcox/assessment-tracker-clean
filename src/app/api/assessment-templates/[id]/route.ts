import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentTemplates, assessmentTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db
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
      .where(eq(assessmentTemplates.id, parseInt(id)))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template[0]);
  } catch (error) {
    logger.dbError('fetch assessment template', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 