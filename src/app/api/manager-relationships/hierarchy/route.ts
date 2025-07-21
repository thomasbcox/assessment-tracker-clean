import { NextRequest, NextResponse } from 'next/server';
import { getRelationshipHierarchy } from '@/lib/services/manager-relationships';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');
    const periodId = searchParams.get('periodId');

    if (!managerId || !periodId) {
      return NextResponse.json(
        { error: 'Manager ID and period ID are required' },
        { status: 400 }
      );
    }

    const parsedPeriodId = parseInt(periodId);
    if (isNaN(parsedPeriodId)) {
      return NextResponse.json(
        { error: 'Manager ID and period ID are required' },
        { status: 400 }
      );
    }

    const hierarchy = await getRelationshipHierarchy(managerId, parsedPeriodId);
    return NextResponse.json(hierarchy);
  } catch (error) {
    logger.error('Failed to fetch relationship hierarchy', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch relationship hierarchy' },
      { status: 500 }
    );
  }
} 