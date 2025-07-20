import { NextRequest, NextResponse } from 'next/server';
import { AssessmentPeriodsService } from '@/lib/services/assessment-periods';
import { AssessmentInstancesService } from '@/lib/services/assessment-instances';
import { ManagerRelationshipsService } from '@/lib/services/manager-relationships';
import { InvitationsService } from '@/lib/services/invitations';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const periodId = parseInt(id);
    
    if (isNaN(periodId)) {
      return NextResponse.json(
        { error: 'Invalid period ID' },
        { status: 400 }
      );
    }

    const period = await AssessmentPeriodsService.getPeriodById(periodId);
    
    if (!period) {
      return NextResponse.json(
        { error: 'Assessment period not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(period);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const periodId = parseInt(id);
    
    if (isNaN(periodId)) {
      return NextResponse.json(
        { error: 'Invalid period ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const updatedPeriod = await AssessmentPeriodsService.updatePeriod(periodId, {
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive,
    });

    return NextResponse.json(updatedPeriod);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const periodId = parseInt(id);
    
    if (isNaN(periodId)) {
      return NextResponse.json(
        { error: 'Invalid period ID' },
        { status: 400 }
      );
    }

    await AssessmentPeriodsService.deletePeriod(periodId);
    return NextResponse.json({ message: 'Assessment period deleted successfully' });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 