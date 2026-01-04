import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import {
  logAuthentication,
  logAccountChange,
  OCSF_ACTIVITY,
  OCSF_STATUS,
} from "@/lib/audit";

/**
 * Generate a unique public slug for a new user
 * Format: firstname-lastname or email-based or random
 */
async function generateUniqueSlug(name?: string | null, email?: string | null): Promise<string> {
  let baseSlug = '';

  if (name) {
    // Convert "John Doe" to "john-doe"
    baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  } else if (email) {
    // Use email username part
    baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  } else {
    // Fallback to random
    baseSlug = `user-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Check if slug exists, add number suffix if needed
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { publicSlug: slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async session({ session, user }) {
      // Fetch full user data including all Discogs connections
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          discogsConnection: {
            select: {
              id: true,
              discogsUsername: true,
              name: true,
              isPrimary: true,
            },
            orderBy: [
              { isPrimary: 'desc' }, // Primary first
              { connectedAt: 'asc' }, // Then by connection date
            ],
          },
        },
      });

      if (fullUser) {
        // Ensure publicSlug exists, generate if needed
        let publicSlug = fullUser.publicSlug;
        if (!publicSlug) {
          publicSlug = await generateUniqueSlug(fullUser.name, fullUser.email);
          await prisma.user.update({
            where: { id: fullUser.id },
            data: { publicSlug },
          });
        }

        // Find primary connection (fallback to first connection if no primary set)
        let primary = fullUser.discogsConnection.find(c => c.isPrimary);

        // Auto-promote first connection to primary if user has connections but no primary
        // This fixes pre-migration accounts that don't have isPrimary set
        if (!primary && fullUser.discogsConnection.length > 0) {
          primary = fullUser.discogsConnection[0];
          // Update database to set this connection as primary
          await prisma.discogsConnection.update({
            where: { id: primary.id },
            data: { isPrimary: true },
          });
          primary = { ...primary, isPrimary: true };
        }

        session.user = {
          ...session.user,
          id: fullUser.id,
          publicSlug: publicSlug,
          displayName: fullUser.displayName,
          hasDiscogsConnection: fullUser.discogsConnection.length > 0,
          discogsUsername: primary?.discogsUsername || null,
          role: fullUser.role,
          status: fullUser.status,
          discogsConnections: fullUser.discogsConnection.map(c => ({
            id: c.id,
            username: c.discogsUsername,
            name: c.name,
            isPrimary: c.isPrimary,
          })),
        };
      }

      return session;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log authentication event
      try {
        await logAuthentication(
          OCSF_ACTIVITY.AUTHENTICATION.LOGON,
          `User signed in via ${account?.provider || 'unknown'}`,
          {
            user: {
              userId: user.id,
              email: user.email,
              name: user.name,
            },
            authProtocol: 'OAuth2',
            service: account?.provider,
            statusId: OCSF_STATUS.SUCCESS,
          }
        );

        // If new user, also log account creation
        if (isNewUser) {
          await logAccountChange(
            OCSF_ACTIVITY.ACCOUNT_CHANGE.CREATE,
            'New user account created',
            {
              userId: user.id,
              email: user.email,
              name: user.name,
            },
            { statusId: OCSF_STATUS.SUCCESS }
          );
        }
      } catch (error) {
        // Don't fail auth if logging fails
        console.error('Failed to log authentication event:', error);
      }
    },

    async signOut(message) {
      // Log sign-out event
      try {
        // message can be { session } or { token } depending on strategy
        const userId = 'session' in message
          ? message.session?.userId
          : message.token?.sub;

        await logAuthentication(
          OCSF_ACTIVITY.AUTHENTICATION.LOGOFF,
          'User signed out',
          {
            user: { userId },
            statusId: OCSF_STATUS.SUCCESS,
          }
        );
      } catch (error) {
        console.error('Failed to log sign-out event:', error);
      }
    },

    async createUser({ user }) {
      // Generate unique publicSlug for new users
      const slug = await generateUniqueSlug(user.name, user.email);

      await prisma.user.update({
        where: { id: user.id },
        data: { publicSlug: slug },
      });
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
