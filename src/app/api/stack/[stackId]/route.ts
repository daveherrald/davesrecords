import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/stack/[stackId] - Get stack details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;

    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      include: {
        curators: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            records: true,
          },
        },
      },
    });

    if (!stack) {
      return NextResponse.json({ error: 'Stack not found' }, { status: 404 });
    }

    // Check if user has access (for private stacks)
    if (!stack.isPublic) {
      const session = await getSession();
      const isCurator = stack.curators.some(c => c.userId === session?.user?.id);

      if (!isCurator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ stack });
  } catch (error) {
    console.error('Failed to fetch stack:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stack' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stack/[stackId] - Update stack
 */
export async function PATCH(
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

    // Check if user is OWNER or CURATOR
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

    const { name, slug, description, type, isPublic, defaultSort, address, city } = body;

    // If slug is being changed, check availability
    if (slug) {
      const existing = await prisma.stack.findUnique({
        where: { slug },
      });

      if (existing && existing.id !== stackId) {
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 400 }
        );
      }
    }

    const stack = await prisma.stack.update({
      where: { id: stackId },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(isPublic !== undefined && { isPublic }),
        ...(defaultSort && { defaultSort }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
      },
      include: {
        curators: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ stack });
  } catch (error) {
    console.error('Failed to update stack:', error);
    return NextResponse.json(
      { error: 'Failed to update stack' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stack/[stackId] - Delete stack
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

    // Check if user is OWNER
    const curator = await prisma.stackCurator.findUnique({
      where: {
        stackId_userId: {
          stackId,
          userId: session.user.id,
        },
      },
    });

    if (!curator || curator.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can delete this stack' },
        { status: 403 }
      );
    }

    await prisma.stack.delete({
      where: { id: stackId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete stack:', error);
    return NextResponse.json(
      { error: 'Failed to delete stack' },
      { status: 500 }
    );
  }
}
