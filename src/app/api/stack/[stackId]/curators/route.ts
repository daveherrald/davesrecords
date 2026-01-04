import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/stack/[stackId]/curators - Invite curator
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
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    // Check if requester is OWNER or CURATOR
    const requesterCurator = await prisma.stackCurator.findUnique({
      where: {
        stackId_userId: {
          stackId,
          userId: session.user.id,
        },
      },
    });

    if (!requesterCurator || requesterCurator.role === 'VIEWER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only OWNER can add other OWNERS
    if (role === 'OWNER' && requesterCurator.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can add other owners' },
        { status: 403 }
      );
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add curator (or update if already exists)
    const curator = await prisma.stackCurator.upsert({
      where: {
        stackId_userId: {
          stackId,
          userId,
        },
      },
      create: {
        stackId,
        userId,
        role,
      },
      update: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            publicSlug: true,
          },
        },
      },
    });

    return NextResponse.json({ curator });
  } catch (error) {
    console.error('Failed to add curator:', error);
    return NextResponse.json(
      { error: 'Failed to add curator' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stack/[stackId]/curators - Remove curator
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { stackId } = await params;
    const { searchParams } = request.nextUrl;
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Check if requester is OWNER
    const requesterCurator = await prisma.stackCurator.findUnique({
      where: {
        stackId_userId: {
          stackId,
          userId: session.user.id,
        },
      },
    });

    if (!requesterCurator || requesterCurator.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can remove curators' },
        { status: 403 }
      );
    }

    // Can't remove yourself if you're the only owner
    if (userIdToRemove === session.user.id) {
      const ownerCount = await prisma.stackCurator.count({
        where: {
          stackId,
          role: 'OWNER',
        },
      });

      if (ownerCount === 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner' },
          { status: 400 }
        );
      }
    }

    await prisma.stackCurator.delete({
      where: {
        stackId_userId: {
          stackId,
          userId: userIdToRemove,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove curator:', error);
    return NextResponse.json(
      { error: 'Failed to remove curator' },
      { status: 500 }
    );
  }
}
