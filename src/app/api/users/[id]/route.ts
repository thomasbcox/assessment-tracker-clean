import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '@/lib/services/users';
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
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await getUserById(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
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
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const updatedUser = await updateUser(id, {
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      isActive: body.isActive,
    });

    return NextResponse.json(updatedUser);
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
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check for existing assessment instances
    const instances = await AssessmentInstancesService.getInstancesByUser(id);
    
    // Check for existing manager relationships (as manager)
    const managerRelationships = await ManagerRelationshipsService.getRelationshipsByManager(id);
    
    // Check for existing manager relationships (as subordinate)
    const subordinateRelationships = await ManagerRelationshipsService.getRelationshipsBySubordinate(id);
    
    // Check for existing invitations (as manager)
    const invitations = await InvitationsService.getInvitationsByManager(id);
    
    // Build error message if any child records exist
    const childRecords = [];
    if (instances.length > 0) {
      childRecords.push(`${instances.length} assessment instance(s)`);
    }
    if (managerRelationships.length > 0) {
      childRecords.push(`${managerRelationships.length} manager relationship(s) as manager`);
    }
    if (subordinateRelationships.length > 0) {
      childRecords.push(`${subordinateRelationships.length} manager relationship(s) as subordinate`);
    }
    if (invitations.length > 0) {
      childRecords.push(`${invitations.length} invitation(s)`);
    }
    
    if (childRecords.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with existing child records',
          childRecords,
          totalChildRecords: instances.length + managerRelationships.length + subordinateRelationships.length + invitations.length,
          message: `Please remove all ${childRecords.join(', ')} before deleting this user.`
        },
        { status: 400 }
      );
    }

    // Delete the user (only if no child records exist)
    try {
      await deleteUser(id);
      return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
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