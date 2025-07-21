import { NextRequest, NextResponse } from 'next/server';
import { createInstance, getAllInstances } from '@/lib/services/assessment-instances';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const instances = await getAllInstances();
    return NextResponse.json(instances);
  } catch (error) {
    logger.error('Failed to fetch assessment instances', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment instances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const instance = await createInstance(data);
    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    logger.error('Failed to create assessment instance', error as Error);
    return NextResponse.json(
      { error: 'Failed to create assessment instance' },
      { status: 400 }
    );
  }
} 