import { NextRequest, NextResponse } from 'next/server';
import { getActiveAssessmentTypes } from '@/lib/services/assessment-types';

export async function GET(request: NextRequest) {
  try {
    const types = await getActiveAssessmentTypes();
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 