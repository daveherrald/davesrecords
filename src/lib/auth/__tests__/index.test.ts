import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import * as encryption from '@/lib/encryption';

// Mock the auth module's NextAuth export
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

// Mock encryption module
vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted:', '')),
}));

describe('auth/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasDiscogsConnection', () => {
    it('returns true when user has connections', async () => {
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(1);

      const { hasDiscogsConnection } = await import('@/lib/auth');
      const result = await hasDiscogsConnection('user-123');

      expect(result).toBe(true);
      expect(prisma.discogsConnection.count).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('returns false when user has no connections', async () => {
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(0);

      const { hasDiscogsConnection } = await import('@/lib/auth');
      const result = await hasDiscogsConnection('user-456');

      expect(result).toBe(false);
    });

    it('returns true when user has multiple connections', async () => {
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(2);

      const { hasDiscogsConnection } = await import('@/lib/auth');
      const result = await hasDiscogsConnection('user-789');

      expect(result).toBe(true);
    });
  });

  describe('getDiscogsTokens', () => {
    it('returns decrypted tokens for primary connection', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue({
        id: 'conn-1',
        accessToken: 'encrypted:test-access-token',
        accessTokenSecret: 'encrypted:test-secret',
        discogsUsername: 'testuser',
      } as any);

      const { getDiscogsTokens } = await import('@/lib/auth');
      const result = await getDiscogsTokens('user-123');

      expect(result).toEqual({
        connectionId: 'conn-1',
        accessToken: 'test-access-token',
        accessTokenSecret: 'test-secret',
        discogsUsername: 'testuser',
      });
      expect(prisma.discogsConnection.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123', isPrimary: true },
        select: {
          id: true,
          accessToken: true,
          accessTokenSecret: true,
          discogsUsername: true,
        },
      });
    });

    it('returns tokens for specific connectionId', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue({
        id: 'conn-2',
        accessToken: 'encrypted:token2',
        accessTokenSecret: 'encrypted:secret2',
        discogsUsername: 'otheruser',
      } as any);

      const { getDiscogsTokens } = await import('@/lib/auth');
      const result = await getDiscogsTokens('user-123', 'conn-2');

      expect(result).toEqual({
        connectionId: 'conn-2',
        accessToken: 'token2',
        accessTokenSecret: 'secret2',
        discogsUsername: 'otheruser',
      });
      expect(prisma.discogsConnection.findFirst).toHaveBeenCalledWith({
        where: { id: 'conn-2', userId: 'user-123' },
        select: expect.any(Object),
      });
    });

    it('returns null when no connection found', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);

      const { getDiscogsTokens } = await import('@/lib/auth');
      const result = await getDiscogsTokens('user-123');

      expect(result).toBeNull();
    });

    it('calls decrypt for both token and secret', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue({
        id: 'conn-1',
        accessToken: 'encrypted:token',
        accessTokenSecret: 'encrypted:secret',
        discogsUsername: 'user',
      } as any);

      const { getDiscogsTokens } = await import('@/lib/auth');
      await getDiscogsTokens('user-123');

      expect(encryption.decrypt).toHaveBeenCalledWith('encrypted:token');
      expect(encryption.decrypt).toHaveBeenCalledWith('encrypted:secret');
    });
  });

  describe('storeDiscogsTokens', () => {
    it('creates new connection when none exists', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(0);
      vi.mocked(prisma.discogsConnection.create).mockResolvedValue({} as any);

      const { storeDiscogsTokens } = await import('@/lib/auth');
      await storeDiscogsTokens(
        'user-1',
        'discogs-123',
        'username',
        'access-token',
        'access-secret',
        'My Collection'
      );

      expect(prisma.discogsConnection.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          discogsId: 'discogs-123',
          discogsUsername: 'username',
          accessToken: 'encrypted:access-token',
          accessTokenSecret: 'encrypted:access-secret',
          name: 'My Collection',
          isPrimary: true, // First connection is primary
        },
      });
    });

    it('sets first connection as primary', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(0);
      vi.mocked(prisma.discogsConnection.create).mockResolvedValue({} as any);

      const { storeDiscogsTokens } = await import('@/lib/auth');
      await storeDiscogsTokens('user-1', 'discogs-1', 'user', 'token', 'secret');

      expect(prisma.discogsConnection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPrimary: true }),
        })
      );
    });

    it('sets second connection as non-primary', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(1);
      vi.mocked(prisma.discogsConnection.create).mockResolvedValue({} as any);

      const { storeDiscogsTokens } = await import('@/lib/auth');
      await storeDiscogsTokens('user-1', 'discogs-2', 'user2', 'token2', 'secret2');

      expect(prisma.discogsConnection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPrimary: false }),
        })
      );
    });

    it('updates existing connection for same Discogs account', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue({
        id: 'existing-conn',
        name: 'Old Name',
      } as any);
      vi.mocked(prisma.discogsConnection.update).mockResolvedValue({} as any);

      const { storeDiscogsTokens } = await import('@/lib/auth');
      await storeDiscogsTokens('user-1', 'discogs-123', 'username', 'new-token', 'new-secret');

      expect(prisma.discogsConnection.update).toHaveBeenCalledWith({
        where: { id: 'existing-conn' },
        data: expect.objectContaining({
          discogsUsername: 'username',
          accessToken: 'encrypted:new-token',
          accessTokenSecret: 'encrypted:new-secret',
        }),
      });
      expect(prisma.discogsConnection.create).not.toHaveBeenCalled();
    });

    it('throws when user has 2 connections and tries to add another', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(2);

      const { storeDiscogsTokens } = await import('@/lib/auth');

      await expect(
        storeDiscogsTokens('user-1', 'new-discogs', 'new-user', 'token', 'secret')
      ).rejects.toThrow('Maximum of 2 Discogs accounts allowed');
    });

    it('uses username as name if not provided', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(0);
      vi.mocked(prisma.discogsConnection.create).mockResolvedValue({} as any);

      const { storeDiscogsTokens } = await import('@/lib/auth');
      await storeDiscogsTokens('user-1', 'discogs-1', 'myusername', 'token', 'secret');

      expect(prisma.discogsConnection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'myusername' }),
        })
      );
    });

    it('encrypts tokens before storing', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.discogsConnection.count).mockResolvedValue(0);
      vi.mocked(prisma.discogsConnection.create).mockResolvedValue({} as any);

      const { storeDiscogsTokens } = await import('@/lib/auth');
      await storeDiscogsTokens('user-1', 'discogs-1', 'user', 'my-token', 'my-secret');

      expect(encryption.encrypt).toHaveBeenCalledWith('my-token');
      expect(encryption.encrypt).toHaveBeenCalledWith('my-secret');
    });
  });

  describe('disconnectDiscogs', () => {
    it('disconnects specific connection by id', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue({
        id: 'conn-1',
        isPrimary: false,
      } as any);
      vi.mocked(prisma.discogsConnection.delete).mockResolvedValue({} as any);

      const { disconnectDiscogs } = await import('@/lib/auth');
      await disconnectDiscogs('user-1', 'conn-1');

      expect(prisma.discogsConnection.delete).toHaveBeenCalledWith({
        where: { id: 'conn-1' },
      });
    });

    it('throws when connection not found', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);

      const { disconnectDiscogs } = await import('@/lib/auth');

      await expect(disconnectDiscogs('user-1', 'invalid-conn')).rejects.toThrow(
        'Connection not found'
      );
    });

    it('promotes next connection when deleting primary', async () => {
      vi.mocked(prisma.discogsConnection.findFirst)
        .mockResolvedValueOnce({ id: 'conn-1', isPrimary: true } as any) // The one to delete
        .mockResolvedValueOnce({ id: 'conn-2' } as any); // Next to promote
      vi.mocked(prisma.discogsConnection.delete).mockResolvedValue({} as any);
      vi.mocked(prisma.discogsConnection.update).mockResolvedValue({} as any);

      const { disconnectDiscogs } = await import('@/lib/auth');
      await disconnectDiscogs('user-1', 'conn-1');

      expect(prisma.discogsConnection.delete).toHaveBeenCalledWith({ where: { id: 'conn-1' } });
      expect(prisma.discogsConnection.update).toHaveBeenCalledWith({
        where: { id: 'conn-2' },
        data: { isPrimary: true },
      });
    });

    it('does not promote when deleting non-primary', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue({
        id: 'conn-2',
        isPrimary: false,
      } as any);
      vi.mocked(prisma.discogsConnection.delete).mockResolvedValue({} as any);

      const { disconnectDiscogs } = await import('@/lib/auth');
      await disconnectDiscogs('user-1', 'conn-2');

      expect(prisma.discogsConnection.update).not.toHaveBeenCalled();
    });

    it('disconnects all connections when no connectionId provided', async () => {
      vi.mocked(prisma.discogsConnection.deleteMany).mockResolvedValue({ count: 2 });

      const { disconnectDiscogs } = await import('@/lib/auth');
      await disconnectDiscogs('user-1');

      expect(prisma.discogsConnection.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('getDiscogsConnections', () => {
    it('returns connections ordered by primary first', async () => {
      const mockConnections = [
        { id: 'conn-1', discogsUsername: 'user1', discogsId: '123', name: 'Primary', isPrimary: true, connectedAt: new Date('2024-01-01') },
        { id: 'conn-2', discogsUsername: 'user2', discogsId: '456', name: 'Secondary', isPrimary: false, connectedAt: new Date('2024-01-15') },
      ];
      vi.mocked(prisma.discogsConnection.findMany).mockResolvedValue(mockConnections as any);

      const { getDiscogsConnections } = await import('@/lib/auth');
      const result = await getDiscogsConnections('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].isPrimary).toBe(true);
      expect(prisma.discogsConnection.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          discogsUsername: true,
          discogsId: true,
          name: true,
          isPrimary: true,
          connectedAt: true,
        },
        orderBy: [
          { isPrimary: 'desc' },
          { connectedAt: 'asc' },
        ],
      });
    });

    it('returns empty array when no connections', async () => {
      vi.mocked(prisma.discogsConnection.findMany).mockResolvedValue([]);

      const { getDiscogsConnections } = await import('@/lib/auth');
      const result = await getDiscogsConnections('user-no-connections');

      expect(result).toEqual([]);
    });
  });

  describe('setPrimaryConnection', () => {
    it('sets new primary via transaction', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue({ id: 'conn-2' } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 2 }, {}]);

      const { setPrimaryConnection } = await import('@/lib/auth');
      await setPrimaryConnection('user-1', 'conn-2');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws when connection not found', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);

      const { setPrimaryConnection } = await import('@/lib/auth');

      await expect(setPrimaryConnection('user-1', 'invalid-conn')).rejects.toThrow(
        'Connection not found'
      );
    });

    it('verifies connection belongs to user', async () => {
      vi.mocked(prisma.discogsConnection.findFirst).mockResolvedValue(null);

      const { setPrimaryConnection } = await import('@/lib/auth');

      await expect(setPrimaryConnection('user-1', 'other-users-conn')).rejects.toThrow();

      expect(prisma.discogsConnection.findFirst).toHaveBeenCalledWith({
        where: { id: 'other-users-conn', userId: 'user-1' },
      });
    });
  });

  describe('updateConnectionName', () => {
    it('updates connection name', async () => {
      vi.mocked(prisma.discogsConnection.updateMany).mockResolvedValue({ count: 1 });

      const { updateConnectionName } = await import('@/lib/auth');
      await updateConnectionName('user-1', 'conn-1', 'New Name');

      expect(prisma.discogsConnection.updateMany).toHaveBeenCalledWith({
        where: { id: 'conn-1', userId: 'user-1' },
        data: { name: 'New Name' },
      });
    });
  });

  describe('isAdmin', () => {
    it('returns true for admin users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'ADMIN' } as any);

      const { isAdmin } = await import('@/lib/auth');
      const result = await isAdmin('admin-1');

      expect(result).toBe(true);
    });

    it('returns false for regular users', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'USER' } as any);

      const { isAdmin } = await import('@/lib/auth');
      const result = await isAdmin('user-1');

      expect(result).toBe(false);
    });

    it('returns false when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const { isAdmin } = await import('@/lib/auth');
      const result = await isAdmin('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('isUserActive', () => {
    it('returns true for ACTIVE status', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ status: 'ACTIVE' } as any);

      const { isUserActive } = await import('@/lib/auth');
      const result = await isUserActive('user-1');

      expect(result).toBe(true);
    });

    it('returns false for BANNED status', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ status: 'BANNED' } as any);

      const { isUserActive } = await import('@/lib/auth');
      const result = await isUserActive('banned-1');

      expect(result).toBe(false);
    });

    it('returns false for SUSPENDED status', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ status: 'SUSPENDED' } as any);

      const { isUserActive } = await import('@/lib/auth');
      const result = await isUserActive('suspended-1');

      expect(result).toBe(false);
    });

    it('returns false when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const { isUserActive } = await import('@/lib/auth');
      const result = await isUserActive('nonexistent');

      expect(result).toBe(false);
    });
  });
});
