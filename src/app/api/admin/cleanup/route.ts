import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredTokens } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // In a real app, you'd check admin permissions here
    // For now, we'll allow this in development
    
    const { action } = await request.json();
    
    if (action === 'cleanup-tokens') {
      await cleanupExpiredTokens();
      
      logger.info('admin-cleanup', 'Expired tokens cleaned up');
      
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
    logger.error('admin-cleanup', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 