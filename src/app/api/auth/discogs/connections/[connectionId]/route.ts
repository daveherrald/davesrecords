import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, disconnectDiscogs, setPrimaryConnection, updateConnectionName } from '@/lib/auth';

/**
 * DELETE /api/auth/discogs/connections/[connectionId]
 * Disconnect a specific Discogs connection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await requireAuth();
    const { connectionId } = params;

    await disconnectDiscogs(session.user.id, connectionId);

    return NextResponse.json({
      success: true,
      message: 'Discogs connection disconnected successfully',
    });
  } catch (error) {
    console.error('Failed to disconnect:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/discogs/connections/[connectionId]
 * Update a Discogs connection (set as primary or rename)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await requireAuth();
    const { connectionId } = params;
    const body = await request.json();

    // Handle setPrimary action
    if (body.setPrimary === true) {
      await setPrimaryConnection(session.user.id, connectionId);
      return NextResponse.json({
        success: true,
        message: 'Primary connection updated',
      });
    }

    // Handle rename action
    if (body.name !== undefined) {
      await updateConnectionName(session.user.id, connectionId, body.name);
      return NextResponse.json({
        success: true,
        message: 'Connection name updated',
      });
    }

    return NextResponse.json(
      { error: 'No valid action specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to update connection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update connection' },
      { status: 500 }
    );
  }
}
