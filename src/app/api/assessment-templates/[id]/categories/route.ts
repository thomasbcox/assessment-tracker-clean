import { NextRequest, NextResponse } from 'next/server';
import { AssessmentTemplatesService } from '@/lib/services/assessment-templates';
import { AssessmentCategoriesService } from '@/lib/services/assessment-categories';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First get the template to find its assessment type
    const template = await AssessmentTemplatesService.getTemplateById(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get categories for this assessment type
    const categories = await AssessmentCategoriesService.getCategoriesByType(template.assessmentTypeId);
    return NextResponse.json(categories);
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