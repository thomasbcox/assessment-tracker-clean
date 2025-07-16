import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentPeriods } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const periods = await db
      .select()
      .from(assessmentPeriods)
      .orderBy(assessmentPeriods.createdAt);

    return NextResponse.json(periods);
  } catch (error) {
    logger.dbError('fetch assessment periods', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, isActive } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this period is being set as active, deactivate all other periods
    if (isActive) {
      await db
        .update(assessmentPeriods)
        .set({ isActive: 0 })
        .where(eq(assessmentPeriods.isActive, 1));
    }

    const newPeriod = await db.insert(assessmentPeriods).values({
      name,
      startDate,
      endDate,
      isActive: isActive ? 1 : 0,
    }).returning();

    return NextResponse.json(newPeriod[0]);
  } catch (error) {
    logger.dbError('create assessment period', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 