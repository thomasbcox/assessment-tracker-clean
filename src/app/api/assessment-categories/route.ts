import { NextRequest, NextResponse } from 'next/server';
import { getActiveAssessmentCategories, createAssessmentCategory, validateCategoryData } from '@/lib/services/assessment-categories';

export async function GET(request: NextRequest) {
  try {
    const categories = await getActiveAssessmentCategories();
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
    const validation = validateCategoryData(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const newCategory = await createAssessmentCategory({
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