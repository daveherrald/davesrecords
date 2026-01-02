import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserCollection } from '@/lib/discogs';
import { getCached, setCached, CACHE_TTL, apiRateLimiter } from '@/lib/cache';

/**
 * GET /api/collection/[slug]
 * Fetch a user's collection by their public slug
 * Supports pagination via ?page=1 query param
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'anonymous';
    const { success } = await apiRateLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Find user by public slug
    const user = await prisma.user.findUnique({
      where: { publicSlug: slug },
      select: {
        id: true,
        displayName: true,
        bio: true,
        isPublic: true,
        discogsConnection: {
          select: {
            discogsUsername: true,
          },
        },
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

    if (!user.discogsConnection) {
      return NextResponse.json(
        { error: 'This user has not connected their Discogs account' },
        { status: 404 }
      );
    }

    // Check cache
    const cacheKey = `collection:${slug}:${page}`;
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    // Fetch from Discogs
    const { albums, pagination } = await getUserCollection(user.id, page);

    const response = {
      user: {
        id: user.id,
        displayName: user.displayName || user.discogsConnection.discogsUsername,
        bio: user.bio,
      },
      albums,
      pagination,
    };

    // Cache the response
    await setCached(cacheKey, response, CACHE_TTL.COLLECTION);

    return NextResponse.json({
      ...response,
      cached: false,
    });
  } catch (error) {
    console.error('Collection API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}
