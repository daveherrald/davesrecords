import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteCachedPattern } from '@/lib/cache';
import {
  logEntityManagement,
  actorFromSession,
  endpointFromRequest,
  OCSF_ACTIVITY,
  OCSF_STATUS,
} from '@/lib/audit';

/**
 * GET /api/user/excluded-albums - Get user's excluded album IDs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const excludedAlbums = await prisma.excludedAlbum.findMany({
      where: { userId: session.user.id },
      select: { releaseId: true },
    });

    const releaseIds = excludedAlbums.map((item) => item.releaseId);

    return NextResponse.json({ excludedReleaseIds: releaseIds });
  } catch (error) {
    console.error('Failed to fetch excluded albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch excluded albums' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/excluded-albums - Add album to exclusion list
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { releaseId } = await request.json();

    if (!releaseId) {
      return NextResponse.json({ error: 'releaseId is required' }, { status: 400 });
    }

    await prisma.excludedAlbum.create({
      data: {
        userId: session.user.id,
        releaseId: releaseId.toString(),
      },
    });

    // Log album exclusion (privacy filter)
    try {
      await logEntityManagement(
        OCSF_ACTIVITY.ENTITY_MANAGEMENT.CREATE,
        `Excluded release from public view: ${releaseId}`,
        {
          type: 'ExcludedAlbum',
          id: releaseId.toString(),
          name: 'Privacy Filter',
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
        }
      );
    } catch (logError) {
      console.error('Failed to log album exclusion (non-fatal):', logError);
    }

    // Invalidate collection cache for this user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { publicSlug: true },
    });

    if (user?.publicSlug) {
      await deleteCachedPattern(`collection:${user.publicSlug}:*`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle unique constraint violation (already excluded)
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      // Still invalidate cache even if already excluded
      const user = await prisma.user.findUnique({
        where: { id: (await getSession())?.user?.id },
        select: { publicSlug: true },
      });
      if (user?.publicSlug) {
        await deleteCachedPattern(`collection:${user.publicSlug}:*`);
      }
      return NextResponse.json({ success: true });
    }

    console.error('Failed to exclude album:', error);
    return NextResponse.json(
      { error: 'Failed to exclude album' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/excluded-albums - Remove album from exclusion list
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { releaseId } = await request.json();

    if (!releaseId) {
      return NextResponse.json({ error: 'releaseId is required' }, { status: 400 });
    }

    await prisma.excludedAlbum.deleteMany({
      where: {
        userId: session.user.id,
        releaseId: releaseId.toString(),
      },
    });

    // Log album inclusion (remove from privacy filter)
    try {
      await logEntityManagement(
        OCSF_ACTIVITY.ENTITY_MANAGEMENT.DELETE,
        `Included release in public view: ${releaseId}`,
        {
          type: 'ExcludedAlbum',
          id: releaseId.toString(),
          name: 'Privacy Filter',
        },
        {
          actor: actorFromSession(session),
          srcEndpoint: endpointFromRequest(request),
          statusId: OCSF_STATUS.SUCCESS,
        }
      );
    } catch (logError) {
      console.error('Failed to log album inclusion (non-fatal):', logError);
    }

    // Invalidate collection cache for this user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { publicSlug: true },
    });

    if (user?.publicSlug) {
      await deleteCachedPattern(`collection:${user.publicSlug}:*`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to include album:', error);
    return NextResponse.json(
      { error: 'Failed to include album' },
      { status: 500 }
    );
  }
}
