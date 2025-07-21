import { NextRequest, NextResponse } from 'next/server';
import { getRelationshipById, updateRelationship, deleteRelationship } from '@/lib/services/manager-relationships';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid relationship ID' }, { status: 400 });
    }

    const relationship = await getRelationshipById(id);
    if (!relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    return NextResponse.json(relationship);
  } catch (error) {
    logger.error('Failed to fetch manager relationship', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch manager relationship' },
      { status: 500 }
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
      return NextResponse.json({ error: 'Invalid relationship ID' }, { status: 400 });
    }

    const data = await request.json();
    const relationship = await updateRelationship(id, data);
    return NextResponse.json(relationship);
  } catch (error) {
    logger.error('Failed to update manager relationship', error as Error);
    return NextResponse.json(
      { error: 'Failed to update manager relationship' },
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
      return NextResponse.json({ error: 'Invalid relationship ID' }, { status: 400 });
    }

    await deleteRelationship(id);
    return NextResponse.json({ message: 'Manager relationship deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete manager relationship', error as Error);
    return NextResponse.json(
      { error: 'Failed to delete manager relationship' },
      { status: 400 }
    );
  }
} 