import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      publicSlug: string;
      displayName?: string | null;
      hasDiscogsConnection: boolean;
      discogsUsername?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    publicSlug?: string;
    displayName?: string | null;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    publicSlug?: string;
    displayName?: string | null;
  }
}
