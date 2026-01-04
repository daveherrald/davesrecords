import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, disconnectDiscogs } from '@/lib/auth';
import {
  logEntityManagement,
  actorFromSession,
  endpointFromRequest,
  OCSF_ACTIVITY,
  OCSF_STATUS,
} from '@/lib/audit';

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

    // Log successful disconnection
    try {
      await logEntityManagement(
        OCSF_ACTIVITY.ENTITY_MANAGEMENT.DELETE,
        `Disconnected Discogs account${connectionId ? ` (${connectionId})` : ' (all)'}`,
        {
          type: 'DiscogsConnection',
          id: connectionId || 'all',
          name: 'Discogs OAuth Connection',
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
        }
      );
    } catch (logError) {
      console.error('Failed to log Discogs disconnection (non-fatal):', logError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discogs disconnect error:', error);

    // Log failed disconnection
    try {
      await logEntityManagement(
        OCSF_ACTIVITY.ENTITY_MANAGEMENT.DELETE,
        'Failed to disconnect Discogs account',
        { type: 'DiscogsConnection' },
        {
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.FAILURE,
          statusDetail: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    } catch (logError) {
      console.error('Failed to log Discogs disconnection failure:', logError);
    }

    return NextResponse.json(
      { error: 'Failed to disconnect Discogs account' },
      { status: 500 }
    );
  }
}
