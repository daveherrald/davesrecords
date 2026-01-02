import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Handle unique constraint violation (already excluded)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: true }); // Already excluded, treat as success
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to include album:', error);
    return NextResponse.json(
      { error: 'Failed to include album' },
      { status: 500 }
    );
  }
}
