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

# Testing
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
npm run test:coverage # Vitest with coverage report
npm run test:e2e     # Playwright E2E tests (requires dev server)
npm run test:all     # Run all tests
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

## Slash Commands

Custom commands in `.claude/commands/`:
- `/commit-push-pr` - Stage, commit, push to branch, create PR
- `/review` - Run parallel code review checks (security, types, taxonomy, API)
- `/deploy` - TypeScript check + deploy to dev and prod
- `/typecheck` - Quick TypeScript verification

## Hooks

PostToolUse hook in `.claude/hooks/format-files.sh` auto-runs ESLint --fix after file edits.

## Testing

See **[docs/testing.md](docs/testing.md)** for the complete testing guide. Key points:

### Philosophy
- **Test behavior, not implementation** - Focus on what code does, not how
- **Prioritize high-value tests** - Security-critical code (encryption, auth) gets 100% coverage
- **Fast feedback loops** - Unit tests in ms, integration in seconds
- **Mock external dependencies** - Prisma, Vercel KV, Discogs API are all mocked

### Test Pyramid
```
       /\        E2E (Playwright) - Critical user journeys
      /  \
     /----\      Integration - API routes
    /      \
   /--------\    Unit (Vitest) - Core utilities, components
```

### Structure
- `src/**/__tests__/` - Unit and integration tests (colocated)
- `tests/e2e/` - Playwright E2E tests
- `tests/mocks/` - Mock factories (Prisma, KV, NextAuth, Discogs)
- `tests/fixtures/` - Test data
- `tests/setup/` - Vitest setup and utilities

### Writing Tests
- Use `vi.hoisted()` for mocks that need to be defined before `vi.mock()` hoisting
- API route tests use `createMockRequest()` and `createParams()` from test-utils
- Component tests use React Testing Library with `@testing-library/jest-dom` matchers

## Accessibility

This project uses Radix UI components (via shadcn/ui) which have strict accessibility requirements.

### Dialog Components
Every `<DialogContent>` **must** have a `<DialogTitle>` child, even if visually hidden:

```tsx
// For loading states or image lightboxes, use sr-only:
<DialogContent>
  <DialogTitle className="sr-only">Loading album details...</DialogTitle>
  {/* content */}
</DialogContent>

// For visible dialogs, use DialogHeader:
<DialogContent>
  <DialogHeader>
    <DialogTitle>Edit Profile</DialogTitle>
    <DialogDescription>Make changes to your profile.</DialogDescription>
  </DialogHeader>
  {/* content */}
</DialogContent>
```

### Common Patterns
- **Conditional rendering**: If dialog content varies by state (loading/error/success), ensure DialogTitle exists in ALL states
- **Image lightboxes**: Use `className="sr-only"` for visually hidden but accessible titles
- **Console errors**: `DialogContent requires DialogTitle` means a title is missing - fix immediately

### Other Radix Components
Similar requirements apply to:
- `AlertDialog` → needs `AlertDialogTitle`
- `Sheet` → needs `SheetTitle`
- `Drawer` → needs title via `aria-labelledby`

## Working with Claude Code

- Start complex tasks in **Plan mode** (shift+tab twice) to align on approach before coding
- Update this CLAUDE.md when Claude makes mistakes to prevent recurrence
- Use `/review` before committing significant changes
- Provide verification methods (tests, type checks) so Claude can validate its work
- **Run `npm run test:run` after making changes** to verify tests still pass
