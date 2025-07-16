import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentQuestions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function PUT(
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

    const updatedQuestion = await db
      .update(assessmentQuestions)
      .set({
        categoryId: parseInt(categoryId),
        questionText,
        displayOrder: parseInt(displayOrder),
      })
      .where(eq(assessmentQuestions.id, parseInt(id)))
      .returning();

    if (updatedQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedQuestion[0]);
  } catch (error) {
    logger.dbError('update assessment question', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deletedQuestion = await db
      .delete(assessmentQuestions)
      .where(eq(assessmentQuestions.id, parseInt(id)))
      .returning();

    if (deletedQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.dbError('delete assessment question', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 