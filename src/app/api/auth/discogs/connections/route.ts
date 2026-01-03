import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getDiscogsConnections } from '@/lib/auth';

/**
 * GET /api/auth/discogs/connections
 * List all Discogs connections for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const connections = await getDiscogsConnections(session.user.id);

    return NextResponse.json({
      connections,
      count: connections.length,
      maxConnections: 2,
    });
  } catch (error) {
    console.error('Failed to get connections:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get connections' },
      { status: 500 }
    );
  }
}
