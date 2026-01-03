import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * GET /api/user/me
 * Get current user's session data
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        publicSlug: session.user.publicSlug,
        displayName: session.user.displayName,
        hasDiscogsConnection: session.user.hasDiscogsConnection,
        discogsUsername: session.user.discogsUsername,
        discogsConnections: session.user.discogsConnections,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}
