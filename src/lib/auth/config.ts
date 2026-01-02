import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

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
      // Fetch full user data including Discogs connection
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          discogsConnection: {
            select: {
              discogsUsername: true,
            },
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

        session.user = {
          ...session.user,
          id: fullUser.id,
          publicSlug: publicSlug,
          displayName: fullUser.displayName,
          hasDiscogsConnection: !!fullUser.discogsConnection,
          discogsUsername: fullUser.discogsConnection?.discogsUsername || null,
          role: fullUser.role,
          status: fullUser.status,
        };
      }

      return session;
    },
  },

  events: {
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
