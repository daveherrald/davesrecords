import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { prisma } from './db';
import { decrypt } from './encryption';
import { getCached, setCached, CACHE_TTL, discogsRateLimiter } from './cache';
import type {
  DiscogsCollectionResponse,
  DiscogsRelease,
  DiscogsIdentity,
  Album,
  AlbumDetail,
} from '@/types/discogs';

const DISCOGS_API_BASE = 'https://api.discogs.com';
const USER_AGENT = 'VinylCollectionViewer/1.0';

/**
 * Create OAuth instance for Discogs API
 */
function createOAuth() {
  return new OAuth({
    consumer: {
      key: process.env.DISCOGS_CONSUMER_KEY!,
      secret: process.env.DISCOGS_CONSUMER_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });
}

/**
 * Make authenticated request to Discogs API
 */
async function makeDiscogsRequest<T>(
  url: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<T> {
  const oauth = createOAuth();

  const requestData = {
    url,
    method: 'GET' as const,
  };

  const token = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...oauth.toHeader(oauth.authorize(requestData, token)),
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Discogs API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user's collection from Discogs
 */
export async function getUserCollection(
  userId: string,
  page: number = 1,
  perPage: number = 100,
  includeExcluded: boolean = false,
  connectionId?: string
): Promise<{
  albums: Album[];
  pagination: DiscogsCollectionResponse['pagination'];
  excludedIds?: Set<string>;
  connectionId: string;
  connectionName: string;
}> {
  // Check rate limit
  const { success } = await discogsRateLimiter.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Get user's Discogs connection (specific or primary, with fallback)
  let connection = connectionId
    ? await prisma.discogsConnection.findFirst({
        where: { id: connectionId, userId },
        select: {
          id: true,
          accessToken: true,
          accessTokenSecret: true,
          discogsUsername: true,
          name: true,
        },
      })
    : await prisma.discogsConnection.findFirst({
        where: { userId, isPrimary: true },
        select: {
          id: true,
          accessToken: true,
          accessTokenSecret: true,
          discogsUsername: true,
          name: true,
        },
      });

  // Fallback: if no primary found, use first available connection
  // This handles pre-migration accounts that don't have isPrimary set
  if (!connection && !connectionId) {
    connection = await prisma.discogsConnection.findFirst({
      where: { userId },
      orderBy: { connectedAt: 'asc' },
      select: {
        id: true,
        accessToken: true,
        accessTokenSecret: true,
        discogsUsername: true,
        name: true,
      },
    });
  }

  if (!connection) {
    throw new Error('Discogs account not connected. Please connect your Discogs account in settings.');
  }

  const accessToken = decrypt(connection.accessToken);
  const accessTokenSecret = decrypt(connection.accessTokenSecret);

  // Build API URL
  const url = `${DISCOGS_API_BASE}/users/${connection.discogsUsername}/collection/folders/0/releases?page=${page}&per_page=${perPage}`;

  // Fetch from API
  const data = await makeDiscogsRequest<DiscogsCollectionResponse>(
    url,
    accessToken,
    accessTokenSecret
  );

  // Get excluded album IDs for this user
  const excludedAlbums = await prisma.excludedAlbum.findMany({
    where: { userId },
    select: { releaseId: true },
  });
  const excludedIds = new Set(excludedAlbums.map((e) => e.releaseId));

  // Transform to our Album type and optionally filter out excluded albums
  const albums: Album[] = data.releases
    .filter((item) => includeExcluded || !excludedIds.has(item.basic_information.id.toString()))
    .map((item) => {
      const basicInfo = item.basic_information;
      return {
        id: basicInfo.id,
        instanceId: item.instance_id,
        title: basicInfo.title,
        artist: basicInfo.artists.map((a) => a.name).join(', '),
        year: basicInfo.year,
        coverImage: basicInfo.cover_image || basicInfo.thumb,
        thumbnail: basicInfo.thumb,
        format: basicInfo.formats.map((f) => f.name).join(', '),
        label: basicInfo.labels[0]?.name || 'Unknown',
        genres: basicInfo.genres,
        styles: basicInfo.styles,
        dateAdded: item.date_added,
      };
    });

  return {
    albums,
    pagination: data.pagination,
    excludedIds, // Always return excludedIds for count calculation
    connectionId: connection.id,
    connectionName: connection.name,
  };
}

/**
 * Get album details from Discogs
 */
export async function getAlbumDetails(
  userId: string,
  releaseId: number,
  connectionId?: string
): Promise<AlbumDetail> {
  // Check cache first
  const cacheKey = `album:${releaseId}`;
  const cached = await getCached<AlbumDetail>(cacheKey);
  if (cached) {
    return cached;
  }

  // Check rate limit
  const { success } = await discogsRateLimiter.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Get user's Discogs connection (specific or primary, with fallback)
  let connection = connectionId
    ? await prisma.discogsConnection.findFirst({
        where: { id: connectionId, userId },
        select: {
          accessToken: true,
          accessTokenSecret: true,
        },
      })
    : await prisma.discogsConnection.findFirst({
        where: { userId, isPrimary: true },
        select: {
          accessToken: true,
          accessTokenSecret: true,
        },
      });

  // Fallback: if no primary found, use first available connection
  if (!connection && !connectionId) {
    connection = await prisma.discogsConnection.findFirst({
      where: { userId },
      orderBy: { connectedAt: 'asc' },
      select: {
        accessToken: true,
        accessTokenSecret: true,
      },
    });
  }

  if (!connection) {
    throw new Error('Discogs account not connected. Please connect your Discogs account in settings.');
  }

  const accessToken = decrypt(connection.accessToken);
  const accessTokenSecret = decrypt(connection.accessTokenSecret);

  // Fetch from API
  const url = `${DISCOGS_API_BASE}/releases/${releaseId}`;
  const release = await makeDiscogsRequest<DiscogsRelease>(
    url,
    accessToken,
    accessTokenSecret
  );

  // Transform to AlbumDetail
  const albumDetail: AlbumDetail = {
    id: release.id,
    instanceId: releaseId,
    title: release.title,
    artist: release.artists.map((a) => a.name).join(', '),
    year: release.year,
    coverImage: release.images[0]?.uri || '',
    thumbnail: release.images[0]?.uri150 || '',
    format: release.formats.map((f) => f.name).join(', '),
    label: release.labels[0]?.name || 'Unknown',
    genres: release.genres,
    styles: release.styles,
    dateAdded: new Date().toISOString(),
    tracklist: release.tracklist.map((track) => ({
      position: track.position,
      title: track.title,
      duration: track.duration,
    })),
    images: release.images,
    catalogNumber: release.labels[0]?.catno || '',
    country: release.country,
    notes: release.notes,
    discogsUrl: release.uri.startsWith('http')
      ? release.uri
      : `https://www.discogs.com${release.uri}`,
  };

  // Cache the result
  await setCached(cacheKey, albumDetail, CACHE_TTL.ALBUM);

  return albumDetail;
}

/**
 * Get user identity from Discogs (used during OAuth)
 */
export async function getDiscogsIdentity(
  accessToken: string,
  accessTokenSecret: string
): Promise<DiscogsIdentity> {
  const url = `${DISCOGS_API_BASE}/oauth/identity`;
  return makeDiscogsRequest<DiscogsIdentity>(url, accessToken, accessTokenSecret);
}
