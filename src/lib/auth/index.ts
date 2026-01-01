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
  const connection = await prisma.discogsConnection.findUnique({
    where: { userId },
  });
  return !!connection;
}

/**
 * Get Discogs OAuth tokens for a user
 * Returns decrypted tokens from DiscogsConnection table
 */
export async function getDiscogsTokens(userId: string): Promise<{
  accessToken: string;
  accessTokenSecret: string;
  discogsUsername: string;
} | null> {
  const connection = await prisma.discogsConnection.findUnique({
    where: { userId },
    select: {
      accessToken: true,
      accessTokenSecret: true,
      discogsUsername: true,
    },
  });

  if (!connection) {
    return null;
  }

  return {
    accessToken: decrypt(connection.accessToken),
    accessTokenSecret: decrypt(connection.accessTokenSecret),
    discogsUsername: connection.discogsUsername,
  };
}

/**
 * Store encrypted Discogs OAuth tokens for a user
 * Creates or updates the DiscogsConnection record
 */
export async function storeDiscogsTokens(
  userId: string,
  discogsId: string,
  discogsUsername: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<void> {
  await prisma.discogsConnection.upsert({
    where: { userId },
    create: {
      userId,
      discogsId,
      discogsUsername,
      accessToken: encrypt(accessToken),
      accessTokenSecret: encrypt(accessTokenSecret),
    },
    update: {
      discogsId,
      discogsUsername,
      accessToken: encrypt(accessToken),
      accessTokenSecret: encrypt(accessTokenSecret),
      updatedAt: new Date(),
    },
  });
}

/**
 * Disconnect Discogs account from a user
 * Deletes the DiscogsConnection record
 */
export async function disconnectDiscogs(userId: string): Promise<void> {
  await prisma.discogsConnection.delete({
    where: { userId },
  });
}
