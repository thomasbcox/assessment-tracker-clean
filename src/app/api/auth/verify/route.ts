import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify magic link
    const user = await verifyMagicLink(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // In a real app, you would set up a session here
    // For demo purposes, we'll just return the user data
    return NextResponse.json({
      user,
      message: 'Login successful',
    });
  } catch (error) {
    logger.authError('verify', error as Error, { token: 'unknown' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 