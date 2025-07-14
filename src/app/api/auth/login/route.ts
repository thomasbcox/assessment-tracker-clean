import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink, getUserByEmail } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create magic link (this will handle rate limiting and token invalidation)
    const token = await createMagicLink(email);

    // In a real app, you would send an email here
    // For demo purposes, we'll just return the token
    console.log(`Magic link for ${email}: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify?token=${token}`);

    return NextResponse.json({
      message: 'Login link sent successfully',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle rate limiting specifically
    if (errorMessage.includes('Too many active tokens')) {
      return NextResponse.json(
        { error: 'Too many active login links. Please wait before requesting another one.' },
        { status: 429 }
      );
    }
    
    logger.authError('login', error as Error, { email: 'unknown' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 