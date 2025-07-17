import { NextRequest, NextResponse } from 'next/server';
import { AssessmentTemplatesService } from '@/lib/services/assessment-templates';

export async function GET(request: NextRequest) {
  try {
    const templates = await AssessmentTemplatesService.getAllTemplates();
    return NextResponse.json(templates);
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
    const newTemplate = await AssessmentTemplatesService.createTemplate(body);
    return NextResponse.json(newTemplate);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 