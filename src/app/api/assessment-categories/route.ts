import { NextRequest, NextResponse } from 'next/server';
import { AssessmentCategoriesService } from '@/lib/services/assessment-categories';

export async function GET(request: NextRequest) {
  try {
    const categories = await AssessmentCategoriesService.getActiveCategories();
    return NextResponse.json(categories);
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
    if (!body.assessmentTypeId || !body.name || body.displayOrder === undefined) {
      return NextResponse.json(
        { error: 'Assessment type ID, name, and display order are required' },
        { status: 400 }
      );
    }

    const newCategory = await AssessmentCategoriesService.createCategory({
      assessmentTypeId: parseInt(body.assessmentTypeId),
      name: body.name,
      description: body.description,
      displayOrder: parseInt(body.displayOrder),
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 