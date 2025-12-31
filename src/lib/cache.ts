import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Cache utilities for Redis (Vercel KV)
 */

/**
 * Get data from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await kv.get<T>(key);
    return cached;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 600
): Promise<void> {
  try {
    await kv.setex(key, ttlSeconds, value);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete data from cache
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    await kv.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Rate limiter for Discogs API
 * Discogs allows 60 requests per minute for authenticated users
 */
export const discogsRateLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(60, '60 s'),
  analytics: true,
  prefix: 'ratelimit:discogs',
});

/**
 * Rate limiter for API endpoints
 * General rate limiting for public endpoints
 */
export const apiRateLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Generate cache key for collection data
 */
export function getCollectionCacheKey(username: string, page: number = 1): string {
  return `collection:${username}:${page}`;
}

/**
 * Generate cache key for album details
 */
export function getAlbumCacheKey(albumId: number): string {
  return `album:${albumId}`;
}

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  COLLECTION: 600, // 10 minutes
  ALBUM: 3600, // 1 hour
  USER: 1800, // 30 minutes
} as const;
