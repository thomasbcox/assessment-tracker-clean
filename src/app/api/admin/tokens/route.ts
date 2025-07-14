import { NextRequest, NextResponse } from 'next/server';
import { db, magicLinks } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd check admin permissions here
    // For now, we'll allow this in development
    
    const tokens = await db
      .select()
      .from(magicLinks)
      .orderBy(magicLinks.createdAt);
    
    return NextResponse.json({
      tokens,
      count: tokens.length
    });
  } catch (error) {
    logger.error('admin-tokens', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 