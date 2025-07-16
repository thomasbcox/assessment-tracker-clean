import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentCategories, assessmentTemplates } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First get the template to find its assessment type
    const template = await db
      .select()
      .from(assessmentTemplates)
      .where(eq(assessmentTemplates.id, parseInt(id)))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get categories for this assessment type
    const categories = await db
      .select()
      .from(assessmentCategories)
      .where(eq(assessmentCategories.assessmentTypeId, template[0].assessmentTypeId))
      .orderBy(assessmentCategories.displayOrder);

    return NextResponse.json(categories);
  } catch (error) {
    logger.dbError('fetch template categories', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 