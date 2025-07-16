import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function POST(request: NextRequest) {
  try {
    // In a real app, you'd check admin permissions here
    // For now, we'll allow this in development
    
    const { action } = await request.json();
    
    if (action === 'cleanup-tokens') {
      await AuthService.cleanupExpiredTokens();
      
      return NextResponse.json({
        message: 'Expired tokens cleaned up successfully',
        action: 'cleanup-tokens'
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
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