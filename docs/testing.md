# Testing Guide

Comprehensive testing strategy for Dave's Records using **Vitest** (unit/integration) and **Playwright** (E2E).

## Philosophy

1. **Test behavior, not implementation** - Focus on what code does, not internal details
2. **Prioritize high-value tests** - Security and auth utilities get highest coverage
3. **Fast feedback loops** - Unit tests run in milliseconds, integration in seconds
4. **Isolated and deterministic** - No external dependencies, reproducible results
5. **Mock at boundaries** - Mock Prisma, Vercel KV, external APIs—not internal code

## Test Pyramid

```
         /\        E2E (5%) - Critical user journeys only
        /  \
       /----\      Integration (15%) - API routes
      /      \
     /--------\    Unit (80%) - Core utilities, components
```

## Toolchain

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit and integration test runner |
| **Playwright** | E2E browser testing |
| **React Testing Library** | Component testing |
| **happy-dom** | Fast DOM implementation for Vitest |
| **@testing-library/jest-dom** | DOM assertion matchers |

## Commands

```bash
npm run test          # Vitest in watch mode (development)
npm run test:run      # Vitest single run
npm run test:coverage # Vitest with coverage report
npm run test:ui       # Vitest with browser UI
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:ui   # Playwright with interactive UI
npm run test:all      # Run everything
```

## Directory Structure

```
davesrecords/
├── src/
│   ├── lib/__tests__/           # Unit tests for utilities
│   │   ├── encryption.test.ts
│   │   ├── cache.test.ts
│   │   └── auth/__tests__/
│   │       └── index.test.ts
│   ├── app/api/__tests__/       # API route integration tests
│   │   ├── collection.test.ts
│   │   └── settings.test.ts
│   └── components/__tests__/    # Component tests
│       ├── SearchBar.test.tsx
│       ├── AlbumCard.test.tsx
│       └── AlbumDetail.test.tsx
├── tests/
│   ├── e2e/                     # Playwright E2E tests
│   │   ├── collection.spec.ts
│   │   ├── settings.spec.ts
│   │   └── auth.spec.ts
│   ├── fixtures/                # Shared test data
│   │   ├── albums.ts
│   │   └── users.ts
│   ├── mocks/                   # Mock implementations
│   │   ├── prisma.ts
│   │   ├── kv.ts
│   │   ├── discogs.ts
│   │   └── next-auth.ts
│   └── setup/
│       ├── vitest.setup.ts      # Global test setup
│       └── test-utils.ts        # Testing utilities
├── vitest.config.ts
└── playwright.config.ts
```

## Mocking Strategy

| Dependency | Mock Location | Approach |
|------------|---------------|----------|
| **Prisma** | `vitest.setup.ts` | Global mock with `vi.mock('@/lib/db')` |
| **Vercel KV** | `vitest.setup.ts` | In-memory mock |
| **Discogs API** | `tests/mocks/discogs.ts` | Fetch mock with realistic responses |
| **NextAuth** | `tests/mocks/next-auth.ts` | Session factory functions |
| **Rate Limiter** | `vitest.setup.ts` | Always returns `{ success: true }` |

### Hoisting Pattern

When mocking modules that are imported by your test file, use `vi.hoisted()` to define mock functions before `vi.mock()` hoisting:

```typescript
// Define mocks BEFORE vi.mock (hoisted to top)
const { mockGetSession, mockGetUserCollection } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetUserCollection: vi.fn(),
}));

// Now use them in vi.mock
vi.mock('@/lib/auth', () => ({
  getSession: mockGetSession,
}));

vi.mock('@/lib/discogs', () => ({
  getUserCollection: mockGetUserCollection,
}));
```

## Writing Tests

### Unit Tests

Test pure functions and utilities in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '@/lib/encryption';

describe('encryption', () => {
  it('encrypts and decrypts data correctly', () => {
    const plaintext = 'secret-token';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });
});
```

### API Route Tests

Use the test utilities for NextRequest mocking:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { createMockRequest, createParams, getResponseJson } from '@tests/setup/test-utils';
import { GET } from '@/app/api/collection/[slug]/route';

describe('GET /api/collection/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const request = createMockRequest('http://localhost:3000/api/collection/unknown');
    const response = await GET(request, { params: createParams({ slug: 'unknown' }) });

    expect(response.status).toBe(404);
    const data = await getResponseJson(response);
    expect(data).toEqual({ error: 'Collection not found' });
  });
});
```

### Component Tests

Use React Testing Library with jest-dom matchers:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../collection/SearchBar';

describe('SearchBar', () => {
  it('calls onChange when user types', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'Beatles' } });

    expect(onChange).toHaveBeenCalledWith('Beatles');
  });
});
```

### E2E Tests

Playwright tests for critical user journeys:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Collection Page', () => {
  test('displays album grid', async ({ page }) => {
    await page.goto('/collection/dave');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('opens album detail modal on click', async ({ page }) => {
    await page.goto('/collection/dave');

    const albumCard = page.locator('[class*="cursor-pointer"]').first();
    await albumCard.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });
});
```

## Coverage Goals

| Category | Target | Rationale |
|----------|--------|-----------|
| `src/lib/encryption.ts` | 100% | Security critical |
| `src/lib/auth/` | 85% | Core authentication |
| `src/lib/cache.ts` | 85% | Infrastructure |
| API Routes | 70% | Integration points |
| Components | 60% | UI behavior |
| **Overall** | 70% | Balanced coverage |

## CI/CD Integration

Tests run automatically via GitHub Actions (`.github/workflows/test.yml`):

1. **typecheck** - `npx tsc --noEmit`
2. **lint** - `npm run lint`
3. **unit-tests** - `npm run test:coverage`
4. **e2e-tests** - `npm run test:e2e` (with Postgres service)
5. **build** - `npm run build`

All jobs must pass before merging to main.

## Running E2E Tests Locally

E2E tests require a running dev server:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e
```

The Playwright config has `reuseExistingServer: true` for local development.

## Troubleshooting

### "Cannot access X before initialization"

Use `vi.hoisted()` to define mocks before `vi.mock()` hoisting. See [Hoisting Pattern](#hoisting-pattern).

### "Invalid Chai property: toBeInTheDocument"

Ensure `@testing-library/jest-dom/vitest` is imported in `vitest.setup.ts`.

### E2E tests timeout

Start the dev server manually before running E2E tests, or increase `webServer.timeout` in `playwright.config.ts`.

### Prisma mock not working

Ensure you're using `vi.mocked(prisma.model.method)` to set up return values:

```typescript
vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', ... });
```
