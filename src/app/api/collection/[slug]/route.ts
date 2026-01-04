import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserCollection } from '@/lib/discogs';
import { getCached, setCached, CACHE_TTL, apiRateLimiter } from '@/lib/cache';
import { getSession } from '@/lib/auth';

/**
 * GET /api/collection/[slug]
 * Fetch a user's collection by their public slug
 * Supports pagination via ?page=1 query param
 * Supports connection selection via ?connectionId= query param
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const connectionId = searchParams.get('connectionId') || undefined;

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
        albumCountDisplay: true,
        discogsConnection: {
          select: {
            id: true,
            discogsUsername: true,
            name: true,
            isPrimary: true,
          },
          orderBy: [
            { isPrimary: 'desc' },
            { connectedAt: 'asc' },
          ],
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

    if (user.discogsConnection.length === 0) {
      return NextResponse.json(
        { error: 'This user has not connected their Discogs account' },
        { status: 404 }
      );
    }

    // Check if viewing own collection
    const session = await getSession();
    const isOwnCollection = session?.user?.id === user.id;

    // Check cache (skip cache for own collection to always show current excluded status)
    // Include connectionId in cache key
    if (!isOwnCollection) {
      const cacheKey = `collection:${slug}:${page}:${connectionId || 'primary'}`;
      const cached = await getCached<Record<string, unknown>>(cacheKey);
      if (cached) {
        return NextResponse.json({
          ...cached,
          isOwnCollection: false,
          cached: true,
        });
      }
    }

    // Fetch from Discogs (include excluded albums if viewing own collection)
    const { albums, pagination, excludedIds, connectionId: usedConnectionId, connectionName } = await getUserCollection(
      user.id,
      page,
      100,
      isOwnCollection,
      connectionId
    );

    // Calculate album counts
    const totalAlbums = pagination.items;
    const publicAlbums = excludedIds ? totalAlbums - excludedIds.size : totalAlbums;

    // Get primary connection for display name fallback
    const primaryConnection = user.discogsConnection.find(c => c.isPrimary);

    const response = {
      user: {
        id: user.id,
        displayName: user.displayName || primaryConnection?.discogsUsername || user.discogsConnection[0]?.discogsUsername,
        bio: user.bio,
      },
      albums,
      pagination,
      isOwnCollection,
      excludedIds: isOwnCollection && excludedIds ? Array.from(excludedIds) : undefined,
      albumCount: {
        total: totalAlbums,
        public: publicAlbums,
        display: user.albumCountDisplay,
      },
      connection: {
        id: usedConnectionId,
        name: connectionName,
      },
      connections: isOwnCollection ? user.discogsConnection.map(c => ({
        id: c.id,
        username: c.discogsUsername,
        name: c.name,
        isPrimary: c.isPrimary,
      })) : undefined,
    };

    // Cache the response (only for public views)
    if (!isOwnCollection) {
      const cacheKey = `collection:${slug}:${page}:${connectionId || 'primary'}`;
      await setCached(cacheKey, response, CACHE_TTL.COLLECTION);
    }

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
