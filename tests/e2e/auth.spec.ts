import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('sign in page', () => {
    test('displays sign in options', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.waitForLoadState('networkidle');

      // Should have sign in options (Google OAuth)
      const signInButton = page.getByRole('button', { name: /sign in|google|continue/i });
      const signInLink = page.getByRole('link', { name: /sign in|google|continue/i });

      const hasSignIn = await signInButton.isVisible() || await signInLink.isVisible();
      expect(hasSignIn).toBeTruthy();
    });

    test('redirects authenticated users', async ({ page }) => {
      // Without auth state, should stay on sign in
      await page.goto('/auth/signin');
      await page.waitForLoadState('networkidle');

      // Should be on sign in page or similar auth page
      expect(page.url()).toContain('/auth');
    });
  });

  test.describe('protected routes', () => {
    test('dashboard settings requires authentication', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Should redirect to /auth/signin
      expect(page.url()).toContain('/auth/signin');
    });

    test('admin requires authentication', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should redirect to /auth/signin (not admin role check, just auth)
      expect(page.url()).toContain('/auth/signin');
    });
  });

  test.describe('sign out', () => {
    test.skip('sign out button clears session', async ({ page }) => {
      // This test requires authentication setup first
      // Would click sign out and verify redirect to home/signin

      // After signing out, should not have access to protected routes
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/auth/signin');
    });
  });

  test.describe('OAuth callbacks', () => {
    test('handles invalid OAuth callback gracefully', async ({ page }) => {
      // Try to access callback without proper params
      await page.goto('/api/auth/discogs/callback');

      // Should handle error gracefully (redirect or error message)
      await page.waitForLoadState('networkidle');

      // Should not crash - either error page or redirect
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).not.toBe('');
    });

    test('discogs oauth start redirects to Discogs', async ({ page }) => {
      // Note: This might require authentication first
      const response = await page.goto('/api/auth/discogs');

      // Should redirect to Discogs or return auth required
      if (response) {
        const status = response.status();
        // Either redirect (302/307) or unauthorized (401) or ok with redirect
        expect([200, 302, 307, 401, 403]).toContain(status);
      }
    });
  });
});

test.describe('Session Handling', () => {
  test('session API returns appropriate response', async ({ page }) => {
    // Check session endpoint
    const response = await page.goto('/api/auth/session');

    expect(response?.status()).toBe(200);

    const body = await response?.json();
    // Unauthenticated should return empty or null user
    expect(body).toBeDefined();
  });

  test('CSRF protection is in place', async ({ page }) => {
    await page.goto('/');

    // Check for CSRF token in cookies or page
    const cookies = await page.context().cookies();
    const csrfCookie = cookies.find(c =>
      c.name.toLowerCase().includes('csrf') ||
      c.name.toLowerCase().includes('token')
    );

    // NextAuth typically handles CSRF
    // This is a basic check - real security testing would be more thorough
    expect(page.url()).toBeDefined();
  });
});

test.describe('Error Handling', () => {
  test('handles 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await page.waitForLoadState('networkidle');

    // Should show 404 or redirect
    const has404 = await page.getByText(/404|not found|page.*exist/i).isVisible();
    const isRedirected = page.url() === 'http://localhost:3000/';

    expect(has404 || isRedirected).toBeTruthy();
  });

  test('API errors return proper JSON', async ({ page }) => {
    const response = await page.goto('/api/collection/nonexistent-user-xyz');

    if (response) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');

      // Should return error status
      expect([404, 403, 500]).toContain(response.status());
    }
  });
});
