import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user/settings/route';
import { prisma } from '@/lib/db';
import * as authLib from '@/lib/auth';
import { createMockRequest, getResponseJson } from '../../../../tests/setup/test-utils';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

// Mock audit logging (non-critical)
vi.mock('@/lib/audit', () => ({
  logAccountChange: vi.fn().mockResolvedValue(undefined),
  actorFromSession: vi.fn().mockReturnValue({ userId: 'test' }),
  endpointFromRequest: vi.fn().mockReturnValue({ ip: '127.0.0.1' }),
  OCSF_ACTIVITY: { ACCOUNT_CHANGE: { OTHER: 99 } },
  OCSF_STATUS: { SUCCESS: 1 },
}));

describe('POST /api/user/settings', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      publicSlug: 'test-user',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authLib.getSession).mockResolvedValue(mockSession as any);
  });

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(authLib.getSession).mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { displayName: 'New Name' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await getResponseJson(response);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('slug validation', () => {
    it('returns 400 when slug is already taken', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'other-user', // Different user
        publicSlug: 'taken-slug',
      } as any);

      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { publicSlug: 'taken-slug' },
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await getResponseJson(response);
      expect(data).toEqual({ error: 'This URL slug is already taken' });
    });

    it('allows keeping same slug', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123', // Same user
        publicSlug: 'test-user',
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { publicSlug: 'test-user' }, // Same as current
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('allows new unique slug', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // Not taken
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { publicSlug: 'new-unique-slug' },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('successful updates', () => {
    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    });

    it('updates all settings', async () => {
      const settings = {
        displayName: 'New Display Name',
        bio: 'New bio text',
        publicSlug: 'new-slug',
        defaultSort: 'year',
        itemsPerPage: 100,
        isPublic: false,
        albumCountDisplay: 'TOTAL_AND_PUBLIC',
      };

      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: settings,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await getResponseJson(response);
      expect(data).toEqual({ success: true });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          displayName: 'New Display Name',
          bio: 'New bio text',
          publicSlug: 'new-slug',
          defaultSort: 'year',
          itemsPerPage: 100,
          isPublic: false,
          albumCountDisplay: 'TOTAL_AND_PUBLIC',
        },
      });
    });

    it('handles partial updates with defaults', async () => {
      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { displayName: 'Only Name' },
      });
      await POST(request);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          displayName: 'Only Name',
          bio: null,
          defaultSort: 'artist',
          itemsPerPage: 50,
          isPublic: true,
          albumCountDisplay: 'PUBLIC_ONLY',
        }),
      });
    });

    it('clears displayName when empty string provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { displayName: '' },
      });
      await POST(request);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          displayName: null,
        }),
      });
    });

    it('preserves current slug when not provided', async () => {
      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { displayName: 'Name Only' },
      });
      await POST(request);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          publicSlug: 'test-user', // From session
        }),
      });
    });

    it('handles isPublic=false explicitly', async () => {
      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { isPublic: false },
      });
      await POST(request);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          isPublic: false,
        }),
      });
    });
  });

  describe('error handling', () => {
    it('returns 500 on database error', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { displayName: 'Test' },
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await getResponseJson(response);
      expect(data).toEqual({ error: 'Failed to update settings' });
    });

    it('continues even if audit logging fails', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      // Import and mock audit to throw
      const audit = await import('@/lib/audit');
      vi.mocked(audit.logAccountChange).mockRejectedValue(new Error('Audit failed'));

      const request = createMockRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        body: { displayName: 'Test' },
      });
      const response = await POST(request);

      // Should still succeed
      expect(response.status).toBe(200);
    });
  });
});
