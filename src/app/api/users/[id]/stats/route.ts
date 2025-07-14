import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentInstances, assessmentPeriods } from '@/lib/db';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get all assessment instances for the user
    const instances = await db
      .select()
      .from(assessmentInstances)
      .where(eq(assessmentInstances.userId, userId));

    // Get active assessment periods
    const activePeriods = await db
      .select()
      .from(assessmentPeriods)
      .where(eq(assessmentPeriods.isActive, 1));

    const total = activePeriods.length;
    const completed = instances.filter(instance => instance.completedAt !== null).length;
    const pending = total - completed;

    return NextResponse.json({
      total,
      completed,
      pending,
    });
  } catch (error) {
    logger.dbError('fetch user stats', error as Error, { userId: 'unknown' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 