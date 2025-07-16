import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentQuestions, assessmentCategories } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const questions = await db
      .select({
        id: assessmentQuestions.id,
        templateId: assessmentQuestions.templateId,
        categoryId: assessmentQuestions.categoryId,
        questionText: assessmentQuestions.questionText,
        displayOrder: assessmentQuestions.displayOrder,
        categoryName: assessmentCategories.name,
      })
      .from(assessmentQuestions)
      .innerJoin(assessmentCategories, eq(assessmentQuestions.categoryId, assessmentCategories.id))
      .where(eq(assessmentQuestions.templateId, parseInt(id)))
      .orderBy(assessmentQuestions.displayOrder);

    return NextResponse.json(questions);
  } catch (error) {
    logger.dbError('fetch template questions', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { categoryId, questionText, displayOrder } = body;

    if (!categoryId || !questionText || !displayOrder) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newQuestion = await db.insert(assessmentQuestions).values({
      templateId: parseInt(id),
      categoryId: parseInt(categoryId),
      questionText,
      displayOrder: parseInt(displayOrder),
    }).returning();

    return NextResponse.json(newQuestion[0]);
  } catch (error) {
    logger.dbError('create template question', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 