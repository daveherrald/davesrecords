import type { User, DiscogsConnection } from '@prisma/client';

/**
 * Mock user data for testing
 * These match the Prisma User model
 */
export const mockUsers: Partial<User>[] = [
  {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    publicSlug: 'test-user',
    displayName: 'Test Display Name',
    bio: 'A test user bio',
    image: null,
    isPublic: true,
    role: 'USER',
    status: 'ACTIVE',
    defaultSort: 'artist',
    itemsPerPage: 50,
    albumCountDisplay: 'PUBLIC_ONLY',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    publicSlug: 'admin-user',
    displayName: 'Admin Display Name',
    bio: null,
    image: null,
    isPublic: true,
    role: 'ADMIN',
    status: 'ACTIVE',
    defaultSort: 'artist',
    itemsPerPage: 100,
    albumCountDisplay: 'TOTAL_AND_PUBLIC',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'banned-user',
    email: 'banned@example.com',
    name: 'Banned User',
    publicSlug: 'banned-user',
    displayName: null,
    bio: null,
    image: null,
    isPublic: false,
    role: 'USER',
    status: 'BANNED',
    defaultSort: 'artist',
    itemsPerPage: 50,
    albumCountDisplay: 'PUBLIC_ONLY',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'private-user',
    email: 'private@example.com',
    name: 'Private User',
    publicSlug: 'private-user',
    displayName: 'Private Collection',
    bio: null,
    image: null,
    isPublic: false,
    role: 'USER',
    status: 'ACTIVE',
    defaultSort: 'year',
    itemsPerPage: 25,
    albumCountDisplay: 'PUBLIC_ONLY',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'no-discogs-user',
    email: 'nodiscogs@example.com',
    name: 'No Discogs User',
    publicSlug: 'no-discogs',
    displayName: null,
    bio: null,
    image: null,
    isPublic: true,
    role: 'USER',
    status: 'ACTIVE',
    defaultSort: 'artist',
    itemsPerPage: 50,
    albumCountDisplay: 'PUBLIC_ONLY',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
];

/**
 * Mock Discogs connection data
 * These match the Prisma DiscogsConnection model
 */
export const mockConnections: Partial<DiscogsConnection>[] = [
  {
    id: 'conn-1',
    userId: 'user-123',
    discogsId: '12345',
    discogsUsername: 'discogs_user',
    name: 'Main Account',
    // These would be encrypted in real data
    accessToken: 'encrypted:test-access-token',
    accessTokenSecret: 'encrypted:test-access-token-secret',
    isPrimary: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'conn-2',
    userId: 'user-123',
    discogsId: '12346',
    discogsUsername: 'discogs_user_secondary',
    name: 'Secondary Account',
    accessToken: 'encrypted:test-access-token-2',
    accessTokenSecret: 'encrypted:test-access-token-secret-2',
    isPrimary: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'conn-admin',
    userId: 'admin-123',
    discogsId: '99999',
    discogsUsername: 'admin_discogs',
    name: 'Admin Collection',
    accessToken: 'encrypted:admin-access-token',
    accessTokenSecret: 'encrypted:admin-access-token-secret',
    isPrimary: true,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
  },
];

/**
 * Helper to get a user by ID
 */
export function getUserById(id: string): Partial<User> | undefined {
  return mockUsers.find((u) => u.id === id);
}

/**
 * Helper to get a user by slug
 */
export function getUserBySlug(slug: string): Partial<User> | undefined {
  return mockUsers.find((u) => u.publicSlug === slug);
}

/**
 * Helper to get connections for a user
 */
export function getConnectionsForUser(userId: string): Partial<DiscogsConnection>[] {
  return mockConnections.filter((c) => c.userId === userId);
}

/**
 * Helper to get primary connection for a user
 */
export function getPrimaryConnection(userId: string): Partial<DiscogsConnection> | undefined {
  return mockConnections.find((c) => c.userId === userId && c.isPrimary);
}
