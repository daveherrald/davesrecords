# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build (prisma generate + db push + next build)
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check
npx prisma studio    # Database GUI
npx prisma db push   # Push schema changes to database
```

## Terminology

See **[docs/taxonomy.md](docs/taxonomy.md)** for the complete glossary. Key points:
- Use Discogs terminology (Release, not Album; Collection, Folder, Instance)
- **Stack** is a Dave's Records concept = a listening station (physical location with records)
- **View** = filtered display of a Collection (privacy filters, sorting)
- **Connection** = a linked Discogs account

## Architecture

**Dave's Records** is a vinyl collection viewer that syncs with Discogs and generates QR codes for mobile browsing.

### Tech Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui (Radix components in `src/components/ui/`)
- PostgreSQL + Prisma ORM
- Vercel KV (Redis) for caching and rate limiting
- Deployed on Vercel

### Two-Part Authentication
1. **NextAuth.js** - Google OAuth for user identity, database sessions
2. **Discogs OAuth 1.0a** - Separate API credentials stored in `DiscogsConnection` table (max 2 per user, tokens encrypted with AES-256-GCM)

Users authenticate with Google, then connect their Discogs account(s) in settings.

### Key Directories
- `src/app/api/` - API routes (auth, admin, user, collection)
- `src/lib/auth/` - Auth helpers: `requireAuth()`, `requireAdmin()`, `getDiscogsTokens()`
- `src/lib/discogs.ts` - Discogs API client with caching and rate limiting
- `src/lib/encryption.ts` - AES-256-GCM for token storage
- `src/types/` - TypeScript definitions including NextAuth augmentation

### Database Models (Prisma)
- **User** - Identity + preferences + role/status (ADMIN, BANNED, etc.)
- **DiscogsConnection** - Encrypted Discogs tokens, supports multiple accounts per user
- **CollectionCache** - Metadata for syncing collections
- **ExcludedAlbum** - Releases hidden from public View (privacy filter)
- **AdminAuditLog / AnalyticsEvent** - Tracking and monitoring

### API Patterns
- Auth routes: `/api/auth/discogs/*` for OAuth flow
- Protected routes use `requireAuth()` or `requireAdmin()` from `@/lib/auth`
- Public collection: `/api/collection/[slug]` (slug is user's `publicSlug`)
- Discogs API calls go through `src/lib/discogs.ts` which handles tokens, caching, rate limits

### Caching
- Collection cache: 10 min TTL
- Album details: 1 hour TTL
- Rate limit: 60 requests/minute to Discogs API
- Cache disabled gracefully in development if KV not configured

## Multi-Account Discogs Support

Users can connect up to 2 Discogs accounts. Key functions in `src/lib/auth/index.ts`:
- `getDiscogsConnections(userId)` - List all connections
- `getDiscogsTokens(userId, connectionId?)` - Get tokens (defaults to primary)
- `setPrimaryConnection(userId, connectionId)` - Change primary account

API routes and collection pages accept optional `connectionId` parameter.
