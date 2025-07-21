import { NextRequest, NextResponse } from 'next/server';
import { createRelationship, getAllRelationships } from '@/lib/services/manager-relationships';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const relationships = await getAllRelationships();
    return NextResponse.json(relationships);
  } catch (error) {
    logger.error('Failed to fetch manager relationships', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch manager relationships' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const relationship = await createRelationship(data);
    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    logger.error('Failed to create manager relationship', error as Error);
    return NextResponse.json(
      { error: 'Failed to create manager relationship' },
      { status: 400 }
    );
  }
} 