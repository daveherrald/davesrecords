import { NextRequest, NextResponse } from 'next/server';
import { getSession, getDiscogsConnections } from '@/lib/auth';
import { getUserCollection } from '@/lib/discogs';
import { prisma } from '@/lib/db';

/**
 * POST /api/stack/[stackId]/populate
 * Auto-populate stack with records from user's Discogs collection(s)
 *
 * Body (optional):
 *   - connectionIds: Array of connection IDs to populate from (omit for all connections)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { stackId } = await params;

    // Get optional connectionIds from body
    let requestedConnectionIds: string[] | undefined;
    try {
      const body = await request.json();
      requestedConnectionIds = body.connectionIds;
    } catch {
      // No body or invalid JSON - use all connections
    }

    // Check if user is a curator
    const curator = await prisma.stackCurator.findUnique({
      where: {
        stackId_userId: {
          stackId,
          userId: session.user.id,
        },
      },
    });

    if (!curator || curator.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all user's connections
    const allConnections = await getDiscogsConnections(session.user.id);

    // Determine which connections to use
    const connectionsToUse = requestedConnectionIds
      ? allConnections.filter(c => requestedConnectionIds.includes(c.id))
      : allConnections;

    if (connectionsToUse.length === 0) {
      return NextResponse.json({ error: 'No connections found' }, { status: 400 });
    }

    // Track stats per connection
    const statsByConnection: Record<string, { added: number; skipped: number; name: string }> = {};
    let totalAdded = 0;
    let totalSkipped = 0;

    // Populate from each connection
    for (const connection of connectionsToUse) {
      let added = 0;
      let skipped = 0;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { albums, pagination } = await getUserCollection(
          session.user.id,
          page,
          100, // Fetch 100 at a time
          true, // Include excluded albums for stacks
          connection.id
        );

        // Add each album to the stack
        for (const album of albums) {
          try {
            await prisma.stackRecord.create({
              data: {
                stackId,
                userId: session.user.id,
                releaseId: album.id.toString(),
                instanceId: album.instanceId.toString(),
                notes: null,
              },
            });
            added++;
          } catch (error) {
            // Skip if already exists (P2002 = unique constraint violation)
            if (error instanceof Error && 'code' in error && error.code === 'P2002') {
              skipped++;
            } else {
              console.error(`Failed to add record ${album.id}:`, error);
            }
          }
        }

        // Check if there are more pages
        hasMore = pagination.page < pagination.pages;
        page++;
      }

      statsByConnection[connection.id] = {
        added,
        skipped,
        name: connection.name,
      };
      totalAdded += added;
      totalSkipped += skipped;
    }

    return NextResponse.json({
      added: totalAdded,
      skipped: totalSkipped,
      byConnection: statsByConnection,
      message: `Added ${totalAdded} records to stack${totalSkipped > 0 ? ` (${totalSkipped} already existed)` : ''}`,
    });
  } catch (error) {
    console.error('Failed to populate stack:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to populate stack',
      },
      { status: 500 }
    );
  }
}
