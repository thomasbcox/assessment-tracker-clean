import { NextRequest, NextResponse } from 'next/server';
import { AssessmentQuestionsService } from '@/lib/services/assessment-questions';

export async function GET() {
  try {
    const questions = await AssessmentQuestionsService.getAllQuestions();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 