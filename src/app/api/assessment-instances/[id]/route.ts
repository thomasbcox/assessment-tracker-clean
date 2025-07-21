import { NextRequest, NextResponse } from 'next/server';
import { getInstanceById, updateAssessmentInstance, deleteInstance, getAssessmentInstance } from '@/lib/services/assessment-instances';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid assessment instance ID' }, { status: 400 });
    }

    const instance = await getAssessmentInstance(id);
    return NextResponse.json(instance);
  } catch (error) {
    logger.error('Failed to fetch assessment instance', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment instance' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid assessment instance ID' }, { status: 400 });
    }

    const data = await request.json();
    const instance = await updateAssessmentInstance(id, data);
    return NextResponse.json(instance);
  } catch (error) {
    logger.error('Failed to update assessment instance', error as Error);
    return NextResponse.json(
      { error: 'Failed to update assessment instance' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid assessment instance ID' }, { status: 400 });
    }

    await deleteInstance(id);
    return NextResponse.json({ message: 'Assessment instance deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete assessment instance', error as Error);
    return NextResponse.json(
      { error: 'Failed to delete assessment instance' },
      { status: 400 }
    );
  }
} 