import { NextRequest, NextResponse } from 'next/server';
import { AssessmentTemplatesService } from '@/lib/assessment-templates.service';

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
    
    try {
      const newTemplate = await AssessmentTemplatesService.createTemplate(body);
      return NextResponse.json(newTemplate);
    } catch (serviceError) {
      const error = serviceError as Error;
      if (error.message === 'Missing required fields') {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      if (error.message === 'Invalid assessment type ID') {
        return NextResponse.json(
          { error: 'Invalid assessment type ID' },
          { status: 400 }
        );
      }
      if (error.message === 'Template with this name and version already exists') {
        return NextResponse.json(
          { error: 'Template with this name and version already exists' },
          { status: 409 }
        );
      }
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 