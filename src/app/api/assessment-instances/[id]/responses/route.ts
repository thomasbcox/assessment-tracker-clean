import { NextRequest, NextResponse } from 'next/server';
import { getResponsesByInstance } from '@/lib/services/assessment-responses';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const responses = await getResponsesByInstance(parseInt(id));
    return NextResponse.json(responses);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch assessment responses' },
      { status: 500 }
    );
  }
} 