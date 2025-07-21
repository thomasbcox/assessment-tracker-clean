import { NextRequest, NextResponse } from 'next/server';
import { InvitationsService } from '@/lib/services/invitations';

export async function GET(request: NextRequest) {
  try {
    const invitations = await InvitationsService.getAllInvitations();
    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
} 