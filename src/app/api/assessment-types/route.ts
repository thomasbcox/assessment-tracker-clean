import { NextRequest, NextResponse } from 'next/server';
import { getActiveAssessmentTypes, createAssessmentType } from '@/lib/services/assessment-types';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Assessment type name is required' },
        { status: 400 }
      );
    }

    const newType = await createAssessmentType({
      name: body.name,
      description: body.description,
      purpose: body.purpose,
    });

    return NextResponse.json(newType);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 