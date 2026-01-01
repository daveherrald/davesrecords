import { NextResponse } from 'next/server';
import { requireAuth, disconnectDiscogs } from '@/lib/auth';

/**
 * Disconnect Discogs account from user
 * POST /api/auth/discogs/disconnect
 */
export async function POST() {
  try {
    // Require authentication
    const session = await requireAuth();

    // Disconnect Discogs
    await disconnectDiscogs(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discogs disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Discogs account' },
      { status: 500 }
    );
  }
}
