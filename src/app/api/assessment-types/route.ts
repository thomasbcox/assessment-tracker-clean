import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const types = await db
      .select()
      .from(assessmentTypes)
      .where(eq(assessmentTypes.isActive, 1));

    return NextResponse.json(types);
  } catch (error) {
    logger.dbError('fetch assessment types', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 