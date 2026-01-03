import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, disconnectDiscogs } from '@/lib/auth';

/**
 * Disconnect Discogs account from user
 * POST /api/auth/discogs/disconnect
 *
 * Body (optional):
 *   - connectionId: Disconnect specific connection (omit to disconnect all)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Get optional connectionId from body
    let connectionId: string | undefined;
    try {
      const body = await request.json();
      connectionId = body.connectionId;
    } catch {
      // No body or invalid JSON - disconnect all (backwards compatible)
    }

    // Disconnect Discogs
    await disconnectDiscogs(session.user.id, connectionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discogs disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Discogs account' },
      { status: 500 }
    );
  }
}
