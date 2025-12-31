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
  perPage: number = 100
): Promise<{ albums: Album[]; pagination: DiscogsCollectionResponse['pagination'] }> {
  // Check rate limit
  const { success } = await discogsRateLimiter.limit(userId);
  if (!success) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Get user's tokens
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessToken: true,
      accessTokenSecret: true,
      discogsUsername: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const accessToken = decrypt(user.accessToken);
  const accessTokenSecret = decrypt(user.accessTokenSecret);

  // Build API URL
  const url = `${DISCOGS_API_BASE}/users/${user.discogsUsername}/collection/folders/0/releases?page=${page}&per_page=${perPage}`;

  // Fetch from API
  const data = await makeDiscogsRequest<DiscogsCollectionResponse>(
    url,
    accessToken,
    accessTokenSecret
  );

  // Transform to our Album type
  const albums: Album[] = data.releases.map((item) => {
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
  };
}

/**
 * Get album details from Discogs
 */
export async function getAlbumDetails(
  userId: string,
  releaseId: number
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

  // Get user's tokens
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessToken: true,
      accessTokenSecret: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const accessToken = decrypt(user.accessToken);
  const accessTokenSecret = decrypt(user.accessTokenSecret);

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
