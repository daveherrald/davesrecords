import { vi } from 'vitest';

/**
 * In-memory cache store for testing
 * Simulates Vercel KV behavior with TTL support
 */
const cache = new Map<string, { value: unknown; expires?: number }>();

export const mockKv = {
  get: vi.fn(async <T>(key: string): Promise<T | null> => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      cache.delete(key);
      return null;
    }
    return entry.value as T;
  }),

  set: vi.fn(async (key: string, value: unknown) => {
    cache.set(key, { value });
    return 'OK';
  }),

  setex: vi.fn(async (key: string, ttl: number, value: unknown) => {
    cache.set(key, { value, expires: Date.now() + ttl * 1000 });
    return 'OK';
  }),

  del: vi.fn(async (...keys: string[]) => {
    keys.forEach((k) => cache.delete(k));
    return keys.length;
  }),

  scan: vi.fn(async (cursor: number, options?: { match?: string; count?: number }) => {
    const pattern = options?.match?.replace('*', '') || '';
    const keys = Array.from(cache.keys()).filter((k) => k.includes(pattern));
    // Simulate cursor-based pagination (return all in one go for tests)
    return ['0', keys] as [string, string[]];
  }),

  keys: vi.fn(async (pattern?: string) => {
    if (!pattern) return Array.from(cache.keys());
    const searchPattern = pattern.replace('*', '');
    return Array.from(cache.keys()).filter((k) => k.includes(searchPattern));
  }),

  // Test helpers (not part of real KV API)
  _clear: () => {
    cache.clear();
  },

  _set: (key: string, value: unknown, ttlSeconds?: number) => {
    cache.set(key, {
      value,
      expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },

  _get: (key: string) => {
    return cache.get(key)?.value;
  },

  _size: () => cache.size,
};

/**
 * Create a fresh mock KV instance for a test
 * Clears all cached data and resets mock call history
 */
export function createFreshMockKv() {
  cache.clear();
  mockKv.get.mockClear();
  mockKv.set.mockClear();
  mockKv.setex.mockClear();
  mockKv.del.mockClear();
  mockKv.scan.mockClear();
  mockKv.keys.mockClear();
  return mockKv;
}

/**
 * Mock rate limiter that always succeeds
 */
export const mockRateLimiter = {
  limit: vi.fn().mockResolvedValue({
    success: true,
    remaining: 59,
    limit: 60,
    reset: Date.now() + 60000,
  }),
};

/**
 * Mock rate limiter that fails (rate limited)
 */
export const mockRateLimiterExceeded = {
  limit: vi.fn().mockResolvedValue({
    success: false,
    remaining: 0,
    limit: 60,
    reset: Date.now() + 60000,
  }),
};
