import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use auth service to handle login logic
    const token = await AuthService.createMagicLink(email);

    // In a real app, you would send an email here
    // For demo purposes, we'll just return the token
    console.log(`Magic link for ${email}: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify?token=${token}`);

    return NextResponse.json({
      message: 'Login link sent successfully',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle rate limiting specifically
    if (errorMessage.includes('Too many active tokens')) {
      return NextResponse.json(
        { error: 'Too many active login links. Please wait before requesting another one.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 