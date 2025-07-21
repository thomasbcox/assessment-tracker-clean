import { NextRequest, NextResponse } from 'next/server';
import { AssessmentCategoriesService } from '@/lib/services/assessment-categories';
import { AssessmentQuestionsService } from '@/lib/services/assessment-questions';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First verify the category exists
    const category = await AssessmentCategoriesService.getCategoryById(parseInt(id));
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get all questions for this category
    const questions = await AssessmentQuestionsService.getQuestionsByCategory(parseInt(id));
    return NextResponse.json(questions);
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