import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/stack/slug/[slug] - Get stack by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const stack = await prisma.stack.findUnique({
      where: { slug },
      include: {
        curators: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                publicSlug: true,
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
      const isCurator = stack.curators.some((c) => c.userId === session?.user?.id);

      if (!isCurator) {
        return NextResponse.json({ error: 'This stack is private' }, { status: 403 });
      }
    }

    return NextResponse.json({ stack });
  } catch (error) {
    console.error('Failed to fetch stack by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stack' },
      { status: 500 }
    );
  }
}
