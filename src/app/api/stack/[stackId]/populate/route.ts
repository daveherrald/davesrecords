import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserCollection } from '@/lib/discogs';
import { prisma } from '@/lib/db';

/**
 * POST /api/stack/[stackId]/populate - Auto-populate stack with all records from user's collection
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

    // Fetch all records from user's collection (paginated)
    let added = 0;
    let skipped = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { albums, pagination } = await getUserCollection(
        session.user.id,
        page,
        100, // Fetch 100 at a time
        true // Include excluded albums for stacks
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
        } catch (error: any) {
          // Skip if already exists (P2002 = unique constraint violation)
          if (error.code === 'P2002') {
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

    return NextResponse.json({
      added,
      skipped,
      message: `Added ${added} records to stack${skipped > 0 ? ` (${skipped} already existed)` : ''}`,
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
