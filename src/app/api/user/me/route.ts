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
        discogsUsername: session.user.discogsUsername,
        publicSlug: session.user.publicSlug,
        displayName: session.user.displayName,
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
