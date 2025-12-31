import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAlbumDetails } from '@/lib/discogs';
import { prisma } from '@/lib/db';

/**
 * GET /api/release/[id]
 * Get detailed information about a specific release
 * Supports both authenticated and public access via ?slug= param
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const releaseId = parseInt(id);
    if (isNaN(releaseId)) {
      return NextResponse.json(
        { error: 'Invalid release ID' },
        { status: 400 }
      );
    }

    // Check if accessing via public slug
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    let userId: string;

    if (slug) {
      // Public access via slug
      const user = await prisma.user.findUnique({
        where: { publicSlug: slug },
        select: {
          id: true,
          isPublic: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        );
      }

      if (!user.isPublic) {
        return NextResponse.json(
          { error: 'This collection is private' },
          { status: 403 }
        );
      }

      userId = user.id;
    } else {
      // Authenticated access
      const session = await getSession();

      if (!session) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }

      userId = session.user.id;
    }

    const albumDetail = await getAlbumDetails(userId, releaseId);

    return NextResponse.json(albumDetail);
  } catch (error) {
    console.error('Get album details error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get album details' },
      { status: 500 }
    );
  }
}
