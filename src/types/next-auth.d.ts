import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      publicSlug: string;
      displayName?: string | null;
      hasDiscogsConnection: boolean;
      discogsUsername?: string | null;
      role: 'USER' | 'ADMIN';
      status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
    } & DefaultSession['user'];
  }
}
