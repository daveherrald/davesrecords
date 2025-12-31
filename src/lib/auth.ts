import { cookies } from 'next/headers';
import { prisma } from './db';
import { encrypt, decrypt } from './encryption';

/**
 * Session type
 */
export interface Session {
  user: {
    id: string;
    discogsUsername: string;
    publicSlug: string;
    email: string | null;
  };
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-token')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      discogsUsername: session.user.discogsUsername,
      publicSlug: session.user.publicSlug,
      email: session.user.email,
    },
  };
}

/**
 * Require authentication - redirect to signin if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
}

// Placeholder handlers for NextAuth API routes
export const GET = async () => {
  return new Response('OK', { status: 200 });
};

export const POST = async () => {
  return new Response('OK', { status: 200 });
};

/**
 * Get Discogs OAuth tokens for a user
 * Decrypts the stored tokens from the database
 */
export async function getDiscogsTokens(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessToken: true,
      accessTokenSecret: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    accessToken: decrypt(user.accessToken),
    accessTokenSecret: decrypt(user.accessTokenSecret),
  };
}

/**
 * Store encrypted Discogs OAuth tokens for a user
 */
export async function storeDiscogsTokens(
  userId: string,
  accessToken: string,
  accessTokenSecret: string
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: encrypt(accessToken),
      accessTokenSecret: encrypt(accessTokenSecret),
    },
  });
}
