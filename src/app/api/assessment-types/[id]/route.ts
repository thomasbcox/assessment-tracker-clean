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

    await deleteType(typeId);
    return NextResponse.json({ message: 'Assessment type deleted successfully' });
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