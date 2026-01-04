import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/stack/instances - Get all instance IDs in any stack
 * Returns a list of instance IDs that are currently in any stack
 * Used to prevent adding the same physical record to multiple stacks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get stack records only from stacks the user has access to
    const stackRecords = await prisma.stackRecord.findMany({
      where: {
        stack: {
          curators: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        instanceId: true,
        stackId: true,
        stack: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create a map of instanceId -> stack info
    const instanceMap: Record<string, { stackId: string; stackName: string }> = {};
    stackRecords.forEach((record) => {
      instanceMap[record.instanceId] = {
        stackId: record.stackId,
        stackName: record.stack.name,
      };
    });

    return NextResponse.json({ instances: instanceMap });
  } catch (error) {
    console.error('Failed to fetch stack instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stack instances' },
      { status: 500 }
    );
  }
}
