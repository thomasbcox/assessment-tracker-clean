import { NextRequest, NextResponse } from 'next/server';
import { AssessmentPeriodsService } from '@/lib/services/assessment-periods';

export async function GET(request: NextRequest) {
  try {
    const periods = await AssessmentPeriodsService.getAllPeriods();
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
    
    // Validate required fields
    if (!body.name || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      );
    }

    const newPeriod = await AssessmentPeriodsService.createPeriod({
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