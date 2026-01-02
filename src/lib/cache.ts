import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Cache utilities for Redis (Vercel KV)
 * In development, Redis is optional - cache operations will fail gracefully
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Get data from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!IS_PRODUCTION) {
    return null; // Skip cache in development
  }
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
  if (!IS_PRODUCTION) {
    return; // Skip cache in development
  }
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
  if (!IS_PRODUCTION) {
    return; // Skip cache in development
  }
  try {
    await kv.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete all cache entries matching a pattern
 * Used to invalidate all pages of a collection
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  if (!IS_PRODUCTION) {
    return; // Skip cache in development
  }
  try {
    // Scan for all keys matching the pattern
    let cursor: string | number = 0;
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await kv.scan(cursor, { match: pattern, count: 100 }) as [string | number, string[]];
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== 0 && cursor !== '0');

    // Delete all matching keys
    if (keysToDelete.length > 0) {
      await kv.del(...keysToDelete);
      console.log(`Invalidated ${keysToDelete.length} cache entries matching ${pattern}`);
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
}

/**
 * No-op rate limiter for development
 */
const noopRateLimiter = {
  limit: async () => ({ success: true, limit: 100, remaining: 100, reset: 0, pending: Promise.resolve() }),
};

/**
 * Rate limiter for Discogs API
 * Discogs allows 60 requests per minute for authenticated users
 */
export const discogsRateLimiter = IS_PRODUCTION
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      analytics: true,
      prefix: 'ratelimit:discogs',
    })
  : noopRateLimiter;

/**
 * Rate limiter for API endpoints
 * General rate limiting for public endpoints
 */
export const apiRateLimiter = IS_PRODUCTION
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : noopRateLimiter;

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
