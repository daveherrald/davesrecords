import NextAuth from "next-auth";
import { authOptions } from "./config";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";

// Re-export authOptions for use in API routes
export { authOptions } from "./config";

// Create auth instance
export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

/**
 * Extended session type with Discogs connection info
 */
export interface ExtendedSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    publicSlug: string;
    displayName?: string | null;
    hasDiscogsConnection: boolean;
    discogsUsername?: string | null;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  };
}

/**
 * Get the current NextAuth session
 */
export async function getSession(): Promise<ExtendedSession | null> {
  const session = await auth();
  return session as ExtendedSession | null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<ExtendedSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
}

/**
 * Check if a user has a Discogs connection
 */
export async function hasDiscogsConnection(userId: string): Promise<boolean> {
  const count = await prisma.discogsConnection.count({
    where: { userId },
  });
  return count > 0;
}

/**
 * Get Discogs OAuth tokens for a user
 * Returns decrypted tokens from DiscogsConnection table
 * If connectionId is provided, returns that specific connection
 * Otherwise returns the primary connection
 */
export async function getDiscogsTokens(
  userId: string,
  connectionId?: string
): Promise<{
  connectionId: string;
  accessToken: string;
  accessTokenSecret: string;
  discogsUsername: string;
} | null> {
  const connection = connectionId
    ? await prisma.discogsConnection.findFirst({
        where: { id: connectionId, userId },
        select: {
          id: true,
          accessToken: true,
          accessTokenSecret: true,
          discogsUsername: true,
        },
      })
    : await prisma.discogsConnection.findFirst({
        where: { userId, isPrimary: true },
        select: {
          id: true,
          accessToken: true,
          accessTokenSecret: true,
          discogsUsername: true,
        },
      });

  if (!connection) {
    return null;
  }

  return {
    connectionId: connection.id,
    accessToken: decrypt(connection.accessToken),
    accessTokenSecret: decrypt(connection.accessTokenSecret),
    discogsUsername: connection.discogsUsername,
  };
}

/**
 * Store encrypted Discogs OAuth tokens for a user
 * Creates or updates the DiscogsConnection record
 * Maximum 2 connections per user
 */
export async function storeDiscogsTokens(
  userId: string,
  discogsId: string,
  discogsUsername: string,
  accessToken: string,
  accessTokenSecret: string,
  name?: string
): Promise<void> {
  // Check if this Discogs account is already connected to this user
  const existing = await prisma.discogsConnection.findFirst({
    where: { userId, discogsId },
  });

  if (existing) {
    // Update existing connection
    await prisma.discogsConnection.update({
      where: { id: existing.id },
      data: {
        discogsUsername,
        accessToken: encrypt(accessToken),
        accessTokenSecret: encrypt(accessTokenSecret),
        name: name || existing.name,
        updatedAt: new Date(),
      },
    });
    return;
  }

  // Check connection limit (2 max)
  const count = await prisma.discogsConnection.count({
    where: { userId },
  });

  if (count >= 2) {
    throw new Error('Maximum of 2 Discogs accounts allowed. Please disconnect one before adding another.');
  }

  // Create new connection (first connection is primary)
  const isPrimary = count === 0;

  await prisma.discogsConnection.create({
    data: {
      userId,
      discogsId,
      discogsUsername,
      accessToken: encrypt(accessToken),
      accessTokenSecret: encrypt(accessTokenSecret),
      name: name || discogsUsername,
      isPrimary,
    },
  });
}

/**
 * Disconnect Discogs account from a user
 * Deletes the DiscogsConnection record
 * If connectionId is provided, disconnects that specific connection
 * Otherwise disconnects all connections (backwards compatible)
 * If deleting primary, promotes next connection
 */
export async function disconnectDiscogs(
  userId: string,
  connectionId?: string
): Promise<void> {
  if (connectionId) {
    // Disconnect specific connection
    const connection = await prisma.discogsConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    await prisma.discogsConnection.delete({
      where: { id: connectionId },
    });

    // If deleted primary, promote next connection
    if (connection.isPrimary) {
      const nextConnection = await prisma.discogsConnection.findFirst({
        where: { userId },
        orderBy: { connectedAt: 'asc' },
      });

      if (nextConnection) {
        await prisma.discogsConnection.update({
          where: { id: nextConnection.id },
          data: { isPrimary: true },
        });
      }
    }
  } else {
    // Disconnect all (backwards compatible)
    await prisma.discogsConnection.deleteMany({
      where: { userId },
    });
  }
}

/**
 * Get all Discogs connections for a user
 * Returns connections ordered by primary first, then by connection date
 */
export async function getDiscogsConnections(userId: string): Promise<Array<{
  id: string;
  discogsUsername: string;
  discogsId: string;
  name: string;
  isPrimary: boolean;
  connectedAt: Date;
}>> {
  const connections = await prisma.discogsConnection.findMany({
    where: { userId },
    select: {
      id: true,
      discogsUsername: true,
      discogsId: true,
      name: true,
      isPrimary: true,
      connectedAt: true,
    },
    orderBy: [
      { isPrimary: 'desc' }, // Primary first
      { connectedAt: 'asc' }, // Then by connection date
    ],
  });

  return connections;
}

/**
 * Set a connection as primary
 * Unsets all other primaries for this user
 */
export async function setPrimaryConnection(
  userId: string,
  connectionId: string
): Promise<void> {
  // Verify connection exists and belongs to user
  const connection = await prisma.discogsConnection.findFirst({
    where: { id: connectionId, userId },
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction([
    // Unset all primaries for this user
    prisma.discogsConnection.updateMany({
      where: { userId },
      data: { isPrimary: false },
    }),
    // Set new primary
    prisma.discogsConnection.update({
      where: { id: connectionId },
      data: { isPrimary: true },
    }),
  ]);
}

/**
 * Update connection name/label
 */
export async function updateConnectionName(
  userId: string,
  connectionId: string,
  name: string
): Promise<void> {
  await prisma.discogsConnection.updateMany({
    where: { id: connectionId, userId },
    data: { name },
  });
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

/**
 * Require admin role - throws error if not admin
 */
export async function requireAdmin(): Promise<ExtendedSession> {
  const session = await requireAuth();

  if (session.user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return session;
}

/**
 * Check if a user account is active (not banned or suspended)
 */
export async function isUserActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  return user?.status === 'ACTIVE';
}
