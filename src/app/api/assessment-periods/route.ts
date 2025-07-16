import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentPeriods, createAssessmentPeriod, validatePeriodData } from '@/lib/services/assessment-periods';

export async function GET(request: NextRequest) {
  try {
    const periods = await getAssessmentPeriods();
    return NextResponse.json(periods);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validatePeriodData(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const newPeriod = await createAssessmentPeriod({
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive,
    });

    return NextResponse.json(newPeriod);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 