import { NextRequest, NextResponse } from 'next/server';
import { validateInstanceCompletion } from '@/lib/services/assessment-responses';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function POST(request: NextRequest) {
  try {
    const { instanceId } = await request.json();
    
    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      );
    }

    const validation = await validateInstanceCompletion(instanceId);
    
    if (!validation.isComplete) {
      return NextResponse.json(
        { error: 'Assessment incomplete', missingQuestions: validation.missingQuestions },
        { status: 400 }
      );
    }

    return NextResponse.json({ isComplete: true });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to validate assessment completion' },
      { status: 500 }
    );
  }
} 