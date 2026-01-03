import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/stack/[stackId]/records - Get all records in stack
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;

    // Get stack to check if it's public
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      select: { isPublic: true },
    });

    if (!stack) {
      return NextResponse.json({ error: 'Stack not found' }, { status: 404 });
    }

    // Check access for private stacks
    if (!stack.isPublic) {
      const session = await getSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const curator = await prisma.stackCurator.findUnique({
        where: {
          stackId_userId: {
            stackId,
            userId: session.user.id,
          },
        },
      });

      if (!curator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Fetch records with user info
    const records = await prisma.stackRecord.findMany({
      where: { stackId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Failed to fetch stack records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stack records' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stack/[stackId]/records - Add record to stack
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
    const { releaseId, instanceId, notes } = body;

    if (!releaseId || !instanceId) {
      return NextResponse.json(
        { error: 'releaseId and instanceId are required' },
        { status: 400 }
      );
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

    // Add record to stack
    const stackRecord = await prisma.stackRecord.create({
      data: {
        stackId,
        userId: session.user.id,
        releaseId: releaseId.toString(),
        instanceId: instanceId.toString(),
        notes,
      },
    });

    return NextResponse.json({ record: stackRecord });
  } catch (error: any) {
    // Handle unique constraint violation (record already in stack)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This record is already in the stack' },
        { status: 400 }
      );
    }

    console.error('Failed to add record to stack:', error);
    return NextResponse.json(
      { error: 'Failed to add record to stack' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stack/[stackId]/records - Update record notes
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
    const { instanceId, notes } = body;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId is required' },
        { status: 400 }
      );
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

    // Get the record to check ownership
    const stackRecord = await prisma.stackRecord.findFirst({
      where: {
        stackId,
        instanceId,
      },
    });

    if (!stackRecord) {
      return NextResponse.json({ error: 'Record not found in stack' }, { status: 404 });
    }

    // Curators can only edit their own records unless they're OWNER
    if (stackRecord.userId !== session.user.id && curator.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'You can only edit your own records' },
        { status: 403 }
      );
    }

    // Update the record notes
    const updatedRecord = await prisma.stackRecord.update({
      where: {
        stackId_instanceId: {
          stackId,
          instanceId,
        },
      },
      data: {
        notes,
      },
    });

    return NextResponse.json({ record: updatedRecord });
  } catch (error) {
    console.error('Failed to update record notes:', error);
    return NextResponse.json(
      { error: 'Failed to update record notes' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stack/[stackId]/records - Remove record from stack
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
    const instanceId = searchParams.get('instanceId');

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId parameter is required' },
        { status: 400 }
      );
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

    // Get the record to check ownership
    const stackRecord = await prisma.stackRecord.findFirst({
      where: {
        stackId,
        instanceId,
      },
    });

    if (!stackRecord) {
      return NextResponse.json({ error: 'Record not found in stack' }, { status: 404 });
    }

    // Curators can only remove their own records unless they're OWNER
    if (stackRecord.userId !== session.user.id && curator.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'You can only remove your own records' },
        { status: 403 }
      );
    }

    await prisma.stackRecord.delete({
      where: {
        stackId_instanceId: {
          stackId,
          instanceId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove record from stack:', error);
    return NextResponse.json(
      { error: 'Failed to remove record from stack' },
      { status: 500 }
    );
  }
}
