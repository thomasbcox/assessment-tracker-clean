import { NextRequest, NextResponse } from 'next/server';
import { AssessmentTemplatesService } from '@/lib/assessment-templates.service';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(request: NextRequest) {
  try {
    const templates = await AssessmentTemplatesService.getAllTemplates();
    return NextResponse.json(templates);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTemplate = await AssessmentTemplatesService.createTemplate(body);
    return NextResponse.json(newTemplate);
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