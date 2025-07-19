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

    // Check for existing assessment instances
    const instances = await AssessmentInstancesService.getInstancesByPeriod(periodId);
    
    // Check for existing manager relationships
    const relationships = await ManagerRelationshipsService.getRelationshipsByPeriod(periodId);
    
    // Check for existing invitations
    const invitations = await InvitationsService.getInvitationsByPeriod(periodId);
    
    // Build error message if any child records exist
    const childRecords = [];
    if (instances.length > 0) {
      childRecords.push(`${instances.length} assessment instance(s)`);
    }
    if (relationships.length > 0) {
      childRecords.push(`${relationships.length} manager relationship(s)`);
    }
    if (invitations.length > 0) {
      childRecords.push(`${invitations.length} invitation(s)`);
    }
    
    if (childRecords.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete assessment period with existing child records',
          childRecords,
          totalChildRecords: instances.length + relationships.length + invitations.length,
          message: `Please remove all ${childRecords.join(', ')} before deleting this period.`
        },
        { status: 400 }
      );
    }

    // Delete the period (only if no child records exist)
    try {
      await AssessmentPeriodsService.deletePeriod(periodId);
      return NextResponse.json({ message: 'Assessment period deleted successfully' });
    } catch (error) {
      console.error('Error deleting assessment period:', error);
      return NextResponse.json(
        { error: 'Failed to delete assessment period' },
        { status: 500 }
      );
    }
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