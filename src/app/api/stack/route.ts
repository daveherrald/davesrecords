import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/stack - List user's stacks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get stacks where user is a curator
    const stacks = await prisma.stack.findMany({
      where: {
        curators: {
          some: {
            userId: session.user.id,
          },
        },
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
        _count: {
          select: {
            records: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ stacks });
  } catch (error) {
    console.error('Failed to fetch stacks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stacks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stack - Create a new stack
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, type, isPublic, defaultSort, address, city } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existing = await prisma.stack.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 400 }
      );
    }

    // Create stack and add creator as OWNER
    const stack = await prisma.stack.create({
      data: {
        name,
        slug,
        description,
        type: type || 'PERSONAL',
        isPublic: isPublic !== undefined ? isPublic : true,
        defaultSort: defaultSort || 'artist',
        address,
        city,
        createdBy: session.user.id,
        curators: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
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
        _count: {
          select: {
            records: true,
          },
        },
      },
    });

    return NextResponse.json({ stack });
  } catch (error) {
    console.error('Failed to create stack:', error);
    return NextResponse.json(
      { error: 'Failed to create stack' },
      { status: 500 }
    );
  }
}
