import { vi } from 'vitest';
import type { Session } from 'next-auth';

/**
 * Extended session type matching our next-auth.d.ts augmentation
 */
export interface MockSession extends Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    publicSlug: string;
    displayName?: string | null;
    hasDiscogsConnection: boolean;
    discogsUsername?: string | null;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
    discogsConnections?: Array<{
      id: string;
      username: string;
      name: string;
      isPrimary: boolean;
    }>;
  };
}

/**
 * Standard active user session
 */
export const mockActiveUser: MockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    publicSlug: 'test-user',
    displayName: 'Test Display Name',
    hasDiscogsConnection: true,
    discogsUsername: 'discogs_user',
    role: 'USER',
    status: 'ACTIVE',
    discogsConnections: [
      {
        id: 'conn-1',
        username: 'discogs_user',
        name: 'Main Account',
        isPrimary: true,
      },
    ],
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * User with multiple Discogs connections
 */
export const mockMultiConnectionUser: MockSession = {
  user: {
    ...mockActiveUser.user,
    id: 'multi-conn-user',
    discogsConnections: [
      {
        id: 'conn-1',
        username: 'main_account',
        name: 'Main Collection',
        isPrimary: true,
      },
      {
        id: 'conn-2',
        username: 'secondary_account',
        name: 'Secondary Collection',
        isPrimary: false,
      },
    ],
  },
  expires: mockActiveUser.expires,
};

/**
 * Admin user session
 */
export const mockAdminUser: MockSession = {
  user: {
    ...mockActiveUser.user,
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    publicSlug: 'admin-user',
    role: 'ADMIN',
  },
  expires: mockActiveUser.expires,
};

/**
 * Banned user session
 */
export const mockBannedUser: MockSession = {
  user: {
    ...mockActiveUser.user,
    id: 'banned-123',
    email: 'banned@example.com',
    status: 'BANNED',
  },
  expires: mockActiveUser.expires,
};

/**
 * Suspended user session
 */
export const mockSuspendedUser: MockSession = {
  user: {
    ...mockActiveUser.user,
    id: 'suspended-123',
    email: 'suspended@example.com',
    status: 'SUSPENDED',
  },
  expires: mockActiveUser.expires,
};

/**
 * User without Discogs connection
 */
export const mockUserNoDiscogs: MockSession = {
  user: {
    ...mockActiveUser.user,
    id: 'no-discogs-123',
    hasDiscogsConnection: false,
    discogsUsername: null,
    discogsConnections: [],
  },
  expires: mockActiveUser.expires,
};

/**
 * Helper to create auth mock with a specific session
 */
export function mockAuth(session: MockSession | null = mockActiveUser) {
  return {
    auth: vi.fn().mockResolvedValue(session),
    getSession: vi.fn().mockResolvedValue(session),
    requireAuth: vi.fn().mockImplementation(async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }
      if (session.user.status !== 'ACTIVE') {
        throw new Error('Account is not active');
      }
      return session;
    }),
    requireAdmin: vi.fn().mockImplementation(async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }
      if (session.user.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }
      return session;
    }),
    isAdmin: vi.fn().mockImplementation(async () => {
      return session?.user.role === 'ADMIN';
    }),
    isUserActive: vi.fn().mockImplementation(async () => {
      return session?.user.status === 'ACTIVE';
    }),
    hasDiscogsConnection: vi.fn().mockImplementation(async () => {
      return session?.user.hasDiscogsConnection ?? false;
    }),
  };
}

/**
 * Mock for next-auth/react hooks
 */
export const mockUseSession = (session: MockSession | null = mockActiveUser) => ({
  useSession: vi.fn().mockReturnValue({
    data: session,
    status: session ? 'authenticated' : 'unauthenticated',
    update: vi.fn(),
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn().mockResolvedValue(session),
});
