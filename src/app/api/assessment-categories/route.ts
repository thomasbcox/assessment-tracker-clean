import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentCategories } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const categories = await db
      .select()
      .from(assessmentCategories)
      .where(eq(assessmentCategories.isActive, 1))
      .orderBy(assessmentCategories.displayOrder);

    return NextResponse.json(categories);
  } catch (error) {
    logger.dbError('fetch assessment categories', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentTypeId, name, description, displayOrder } = body;

    if (!assessmentTypeId || !name || !displayOrder) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newCategory = await db.insert(assessmentCategories).values({
      assessmentTypeId: parseInt(assessmentTypeId),
      name,
      description,
      displayOrder: parseInt(displayOrder),
    }).returning();

    return NextResponse.json(newCategory[0]);
  } catch (error) {
    logger.dbError('create assessment category', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 