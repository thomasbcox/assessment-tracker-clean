import { NextRequest, NextResponse } from 'next/server';
import { getTypeById, updateType, deleteType } from '@/lib/services/assessment-types';
import { AssessmentCategoriesService } from '@/lib/services/assessment-categories';
import { AssessmentTemplatesService } from '@/lib/services/assessment-templates';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const typeId = parseInt(id);
    
    if (isNaN(typeId)) {
      return NextResponse.json(
        { error: 'Invalid assessment type ID' },
        { status: 400 }
      );
    }

    const assessmentType = await getTypeById(typeId);
    
    if (!assessmentType) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assessmentType);
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
    const typeId = parseInt(id);
    
    if (isNaN(typeId)) {
      return NextResponse.json(
        { error: 'Invalid assessment type ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const updatedType = await updateType(typeId, {
      name: body.name,
      description: body.description,
      purpose: body.purpose,
      isActive: body.isActive,
    });

    return NextResponse.json(updatedType);
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
    const typeId = parseInt(id);
    
    if (isNaN(typeId)) {
      return NextResponse.json(
        { error: 'Invalid assessment type ID' },
        { status: 400 }
      );
    }

    // Check for existing categories
    const categories = await AssessmentCategoriesService.getCategoriesByType(typeId);
    
    // Check for existing templates
    const templates = await AssessmentTemplatesService.getTemplatesByType(typeId.toString());
    
    // Build error message if any child records exist
    const childRecords = [];
    if (categories.length > 0) {
      childRecords.push(`${categories.length} assessment category(ies)`);
    }
    if (templates.length > 0) {
      childRecords.push(`${templates.length} assessment template(s)`);
    }
    
    if (childRecords.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete assessment type with existing child records',
          childRecords,
          totalChildRecords: categories.length + templates.length,
          message: `Please remove all ${childRecords.join(', ')} before deleting this assessment type.`
        },
        { status: 400 }
      );
    }

    // Delete the assessment type (only if no child records exist)
    try {
      await deleteType(typeId);
      return NextResponse.json({ message: 'Assessment type deleted successfully' });
    } catch (error) {
      console.error('Error deleting assessment type:', error);
      return NextResponse.json(
        { error: 'Failed to delete assessment type' },
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