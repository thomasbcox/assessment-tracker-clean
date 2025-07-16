import { NextRequest, NextResponse } from 'next/server';
import { getUserStats } from '@/lib/services/users';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const stats = await getUserStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
} 