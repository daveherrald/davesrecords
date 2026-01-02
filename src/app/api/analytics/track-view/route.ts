/**
 * Analytics API: Track Collection View
 * POST /api/analytics/track-view - Record a collection view
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Track the view
    await prisma.collectionView.create({
      data: {
        userId,
        viewerIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        viewerAgent: request.headers.get('user-agent') || undefined,
        referer: request.headers.get('referer') || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
