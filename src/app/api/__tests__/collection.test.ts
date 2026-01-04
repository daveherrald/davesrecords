import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import {
  createMockRequest,
  createParams,
  getResponseJson,
  createRequestWithIP,
} from '../../../../tests/setup/test-utils';

// Type for collection API response
interface CollectionResponse {
  user?: { id: string; displayName?: string; bio?: string };
  albums?: Array<{ id: number; title?: string }>;
  pagination?: { items: number; pages: number; page: number; per_page: number };
  isOwnCollection?: boolean;
  excludedIds?: string[];
  connections?: Array<{ id: string; username: string; name: string; isPrimary: boolean }>;
  cached?: boolean;
  totalRecords?: number;
  publicRecords?: number;
  albumCount?: { total: number; public: number };
  error?: string;
}

// Use vi.hoisted to define mocks before vi.mock hoisting
const { mockRateLimiter, mockGetCached, mockSetCached, mockGetSession, mockGetUserCollection } = vi.hoisted(() => ({
  mockRateLimiter: {
    limit: vi.fn(),
  },
  mockGetCached: vi.fn(),
  mockSetCached: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetUserCollection: vi.fn(),
}));

// Mock the modules
vi.mock('@/lib/discogs', () => ({
  getUserCollection: mockGetUserCollection,
}));

vi.mock('@/lib/cache', () => ({
  apiRateLimiter: mockRateLimiter,
  getCached: mockGetCached,
  setCached: mockSetCached,
  CACHE_TTL: { COLLECTION: 600, ALBUM: 3600, USER: 1800 },
}));

vi.mock('@/lib/auth', () => ({
  getSession: mockGetSession,
}));

// Import after mocking
import { GET } from '@/app/api/collection/[slug]/route';
import * as cacheLib from '@/lib/cache';

describe('GET /api/collection/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset defaults
    mockRateLimiter.limit.mockResolvedValue({ success: true, remaining: 99, limit: 100, reset: Date.now() + 60000 });
    mockGetCached.mockResolvedValue(null);
    mockGetSession.mockResolvedValue(null);
  });

  describe('user lookup', () => {
    it('returns 404 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/collection/unknown');
      const response = await GET(request, { params: createParams({ slug: 'unknown' }) });

      expect(response.status).toBe(404);
      const data = await getResponseJson<CollectionResponse>(response);
      expect(data).toEqual({ error: 'Collection not found' });
    });

    it('returns 403 when collection is private', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        isPublic: false,
        discogsConnection: [{ id: 'conn-1', isPrimary: true }],
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/private-user');
      const response = await GET(request, { params: createParams({ slug: 'private-user' }) });

      expect(response.status).toBe(403);
      const data = await getResponseJson<CollectionResponse>(response);
      expect(data).toEqual({ error: 'This collection is private' });
    });

    it('returns 404 when user has no Discogs connection', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        isPublic: true,
        discogsConnection: [],
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/no-discogs');
      const response = await GET(request, { params: createParams({ slug: 'no-discogs' }) });

      expect(response.status).toBe(404);
      const data = await getResponseJson<CollectionResponse>(response);
      expect(data).toEqual({ error: 'This user has not connected their Discogs account' });
    });
  });

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: false,
        remaining: 0,
        limit: 100,
        reset: Date.now() + 60000,
      });

      const request = createRequestWithIP(
        'http://localhost:3000/api/collection/test',
        '192.168.1.1'
      );
      const response = await GET(request, { params: createParams({ slug: 'test' }) });

      expect(response.status).toBe(429);
      const data = await getResponseJson<CollectionResponse>(response);
      expect(data).toEqual({ error: 'Too many requests. Please try again later.' });
    });

    it('uses IP from x-forwarded-for header', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = createRequestWithIP(
        'http://localhost:3000/api/collection/test',
        '10.0.0.1'
      );
      await GET(request, { params: createParams({ slug: 'test' }) });

      expect(mockRateLimiter.limit).toHaveBeenCalledWith('10.0.0.1');
    });
  });

  describe('caching', () => {
    it('returns cached response for public view', async () => {
      const cachedData = {
        user: { id: 'user-1', displayName: 'Test User' },
        albums: [{ id: 1, title: 'Test Album' }],
        pagination: { items: 10, pages: 1 },
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        isPublic: true,
        discogsConnection: [{ id: 'conn-1', isPrimary: true, discogsUsername: 'testuser' }],
      } as any);
      mockGetCached.mockResolvedValue(cachedData);

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      const response = await GET(request, { params: createParams({ slug: 'test' }) });

      expect(response.status).toBe(200);
      const data = await getResponseJson<CollectionResponse>(response);
      expect(data.cached).toBe(true);
      expect(data.isOwnCollection).toBe(false);
      expect(mockGetUserCollection).not.toHaveBeenCalled();
    });

    it('skips cache for own collection', async () => {
      const session = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue(session as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        isPublic: true,
        albumCountDisplay: 'PUBLIC_ONLY',
        discogsConnection: [{ id: 'conn-1', isPrimary: true, discogsUsername: 'testuser', name: 'Main' }],
      } as any);
      mockGetUserCollection.mockResolvedValue({
        albums: [],
        pagination: { items: 10, pages: 1, page: 1, per_page: 100 },
        excludedIds: new Set(),
        connectionId: 'conn-1',
        connectionName: 'Main',
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      await GET(request, { params: createParams({ slug: 'test' }) });

      expect(mockGetCached).not.toHaveBeenCalled();
      expect(mockGetUserCollection).toHaveBeenCalled();
    });

    it('caches response for public view', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        isPublic: true,
        albumCountDisplay: 'PUBLIC_ONLY',
        discogsConnection: [{ id: 'conn-1', isPrimary: true, discogsUsername: 'testuser', name: 'Main' }],
      } as any);
      mockGetUserCollection.mockResolvedValue({
        albums: [{ id: 1 }],
        pagination: { items: 10, pages: 1, page: 1, per_page: 100 },
        excludedIds: new Set(),
        connectionId: 'conn-1',
        connectionName: 'Main',
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      await GET(request, { params: createParams({ slug: 'test' }) });

      expect(mockSetCached).toHaveBeenCalledWith(
        'collection:test:1:primary',
        expect.any(Object),
        cacheLib.CACHE_TTL.COLLECTION
      );
    });
  });

  describe('successful response', () => {
    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        displayName: 'Test User',
        bio: 'Test bio',
        isPublic: true,
        albumCountDisplay: 'PUBLIC_ONLY',
        discogsConnection: [{
          id: 'conn-1',
          isPrimary: true,
          discogsUsername: 'testuser',
          name: 'Main Account',
        }],
      } as any);
    });

    it('returns collection data for public view', async () => {
      mockGetUserCollection.mockResolvedValue({
        albums: [{ id: 1, title: 'Abbey Road' }],
        pagination: { items: 50, pages: 1, page: 1, per_page: 100 },
        excludedIds: new Set(['2', '3']),
        connectionId: 'conn-1',
        connectionName: 'Main Account',
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      const response = await GET(request, { params: createParams({ slug: 'test' }) });

      expect(response.status).toBe(200);
      const data = await getResponseJson<CollectionResponse>(response);

      expect(data.user).toEqual({
        id: 'user-1',
        displayName: 'Test User',
        bio: 'Test bio',
      });
      expect(data.albums).toHaveLength(1);
      expect(data.isOwnCollection).toBe(false);
      expect(data.excludedIds).toBeUndefined(); // Not shown for public view
      expect(data.connections).toBeUndefined(); // Not shown for public view
      expect(data.cached).toBe(false);
    });

    it('returns excludedIds for own collection', async () => {
      const session = { user: { id: 'user-1' } };
      mockGetSession.mockResolvedValue(session as any);
      mockGetUserCollection.mockResolvedValue({
        albums: [],
        pagination: { items: 50, pages: 1, page: 1, per_page: 100 },
        excludedIds: new Set(['123', '456']),
        connectionId: 'conn-1',
        connectionName: 'Main Account',
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      const response = await GET(request, { params: createParams({ slug: 'test' }) });

      const data = await getResponseJson<CollectionResponse>(response);
      expect(data.isOwnCollection).toBe(true);
      expect(data.excludedIds).toEqual(['123', '456']);
      expect(data.connections).toBeDefined();
    });

    it('passes connectionId query param to getUserCollection', async () => {
      mockGetUserCollection.mockResolvedValue({
        albums: [],
        pagination: { items: 10, pages: 1, page: 1, per_page: 100 },
        excludedIds: new Set(),
        connectionId: 'conn-2',
        connectionName: 'Secondary',
      } as any);

      const request = createMockRequest(
        'http://localhost:3000/api/collection/test?connectionId=conn-2'
      );
      await GET(request, { params: createParams({ slug: 'test' }) });

      expect(mockGetUserCollection).toHaveBeenCalledWith(
        'user-1',
        1,
        100,
        false,
        'conn-2'
      );
    });

    it('passes page query param', async () => {
      mockGetUserCollection.mockResolvedValue({
        albums: [],
        pagination: { items: 200, pages: 2, page: 2, per_page: 100 },
        excludedIds: new Set(),
        connectionId: 'conn-1',
        connectionName: 'Main',
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/test?page=2');
      await GET(request, { params: createParams({ slug: 'test' }) });

      expect(mockGetUserCollection).toHaveBeenCalledWith(
        'user-1',
        2,
        100,
        false,
        undefined
      );
    });

    it('calculates album counts correctly', async () => {
      mockGetUserCollection.mockResolvedValue({
        albums: [],
        pagination: { items: 100, pages: 1, page: 1, per_page: 100 },
        excludedIds: new Set(['1', '2', '3', '4', '5']), // 5 excluded
        connectionId: 'conn-1',
        connectionName: 'Main',
      } as any);

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      const response = await GET(request, { params: createParams({ slug: 'test' }) });

      const data = await getResponseJson<CollectionResponse>(response);
      expect(data.albumCount).toEqual({
        total: 100,
        public: 95, // 100 - 5
        display: 'PUBLIC_ONLY',
      });
    });
  });

  describe('error handling', () => {
    it('returns 500 on unexpected error', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      const response = await GET(request, { params: createParams({ slug: 'test' }) });

      expect(response.status).toBe(500);
      const data = await getResponseJson<CollectionResponse>(response);
      expect(data).toEqual({ error: 'Failed to fetch collection' });
    });

    it('returns 500 when Discogs API fails', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        isPublic: true,
        discogsConnection: [{ id: 'conn-1', isPrimary: true }],
      } as any);
      mockGetUserCollection.mockRejectedValue(new Error('Discogs API error'));

      const request = createMockRequest('http://localhost:3000/api/collection/test');
      const response = await GET(request, { params: createParams({ slug: 'test' }) });

      expect(response.status).toBe(500);
    });
  });
});
