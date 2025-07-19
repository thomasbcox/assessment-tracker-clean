import { NextRequest, NextResponse } from 'next/server';
import { AssessmentCategoriesService } from '@/lib/services/assessment-categories';
import { AssessmentQuestionsService } from '@/lib/services/assessment-questions';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await AssessmentCategoriesService.getCategoryById(categoryId);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const updatedCategory = await AssessmentCategoriesService.updateCategory(categoryId, {
      name: body.name,
      description: body.description,
      displayOrder: body.displayOrder ? parseInt(body.displayOrder) : undefined,
    });

    return NextResponse.json(updatedCategory);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category has any questions
    const questionsInCategory = await AssessmentQuestionsService.getQuestionsByCategory(categoryId);
    
    if (questionsInCategory.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category with existing questions',
          questionCount: questionsInCategory.length,
          message: 'Please delete or move all questions in this category before deleting the category'
        },
        { status: 400 }
      );
    }

    // Delete the category (only if no questions exist)
    try {
      await AssessmentCategoriesService.deleteCategory(categoryId);
      return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }
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