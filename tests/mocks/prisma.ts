import { vi } from 'vitest';
import type { User, DiscogsConnection } from '@prisma/client';
import { mockUsers, mockConnections } from '../fixtures/users';

export type MockPrismaClient = {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  discogsConnection: {
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  excludedAlbum: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

/**
 * Create a mock Prisma client with pre-configured responses
 * based on the fixture data
 */
export function createMockPrismaClient(): MockPrismaClient {
  return {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return (
          mockUsers.find(
            (u) => u.id === where.id || u.publicSlug === where.publicSlug || u.email === where.email
          ) || null
        );
      }),
      findMany: vi.fn().mockResolvedValue(mockUsers),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        return mockUsers.find((u) => u.id === where.id) || null;
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const user = mockUsers.find((u) => u.id === where.id);
        return { ...user, ...data };
      }),
      create: vi.fn().mockImplementation(({ data }) => ({
        id: 'new-user-id',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      delete: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(mockUsers.length),
    },
    discogsConnection: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        return (
          mockConnections.find(
            (c) =>
              c.userId === where.userId &&
              (where.isPrimary === undefined || c.isPrimary === where.isPrimary) &&
              (where.id === undefined || c.id === where.id)
          ) || null
        );
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return mockConnections.find((c) => c.id === where.id) || null;
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        if (where?.userId) {
          return mockConnections.filter((c) => c.userId === where.userId);
        }
        return mockConnections;
      }),
      count: vi.fn().mockImplementation(({ where }) => {
        if (where?.userId) {
          return mockConnections.filter((c) => c.userId === where.userId).length;
        }
        return mockConnections.length;
      }),
      create: vi.fn().mockImplementation(({ data }) => ({
        id: 'new-conn-id',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const conn = mockConnections.find((c) => c.id === where.id);
        return { ...conn, ...data };
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      delete: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    excludedAlbum: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }) => ({
        id: 'new-exclusion-id',
        ...data,
        createdAt: new Date(),
      })),
      delete: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn((operations) => Promise.all(operations)),
  };
}

/**
 * Helper to set up mock responses for specific scenarios
 */
export function setupPrismaMock(prisma: MockPrismaClient, scenario: 'default' | 'noUser' | 'banned') {
  switch (scenario) {
    case 'noUser':
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.discogsConnection.findFirst.mockResolvedValue(null);
      break;
    case 'banned':
      prisma.user.findUnique.mockResolvedValue({
        ...mockUsers[0],
        status: 'BANNED',
      });
      break;
    default:
      // Reset to default fixture-based behavior
      prisma.user.findUnique.mockImplementation(({ where }: { where: { id?: string; publicSlug?: string } }) => {
        return mockUsers.find((u) => u.id === where.id || u.publicSlug === where.publicSlug) || null;
      });
  }
}
