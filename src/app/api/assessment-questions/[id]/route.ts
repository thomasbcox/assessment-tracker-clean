import { NextRequest, NextResponse } from 'next/server';
import { AssessmentQuestionsService } from '@/lib/services/assessment-questions';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedQuestion = await AssessmentQuestionsService.updateQuestion(parseInt(id), {
      categoryId: parseInt(body.categoryId),
      questionText: body.questionText,
      displayOrder: parseInt(body.displayOrder)
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
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
    await AssessmentQuestionsService.deleteQuestion(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 