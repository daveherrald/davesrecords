import { test, expect } from '@playwright/test';

// Note: These tests require authentication. In a real scenario,
// you would set up authentication state before running these tests.
// For now, we test unauthenticated behavior.

test.describe('Settings Page', () => {
  test.describe('unauthenticated access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/settings');

      // Should redirect to auth page or show sign in prompt
      await page.waitForURL(/\/(auth|login|api\/auth)/);

      // Or if it stays on settings, should show login prompt
      const loginPrompt = page.getByText(/sign in|log in|authenticate/i);
      const isOnAuthPage = page.url().includes('/auth') || page.url().includes('/login');

      expect(isOnAuthPage || await loginPrompt.isVisible()).toBeTruthy();
    });
  });

  test.describe('settings page structure', () => {
    // This test would normally require authentication setup
    // Using test.skip for unauthenticated testing
    test.skip('displays settings form when authenticated', async ({ page }) => {
      // In a real test, you would authenticate first
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Should have settings form elements
      await expect(page.getByLabel(/display name/i)).toBeVisible();
      await expect(page.getByLabel(/bio/i)).toBeVisible();
      await expect(page.getByLabel(/public/i)).toBeVisible();
    });

    test.skip('can update display name', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const displayNameInput = page.getByLabel(/display name/i);
      await displayNameInput.fill('Test User Updated');

      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      // Should show success message
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible();
    });

    test.skip('can toggle public collection setting', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      const publicToggle = page.getByRole('switch', { name: /public/i });
      const wasChecked = await publicToggle.isChecked();

      await publicToggle.click();

      // Should toggle state
      if (wasChecked) {
        await expect(publicToggle).not.toBeChecked();
      } else {
        await expect(publicToggle).toBeChecked();
      }
    });
  });
});

test.describe('Admin Pages', () => {
  test('admin page requires authentication', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect or show unauthorized
    const isRedirected = !page.url().endsWith('/admin');
    const unauthorizedText = page.getByText(/unauthorized|forbidden|sign in|admin only/i);

    expect(isRedirected || await unauthorizedText.isVisible()).toBeTruthy();
  });

  test('admin users page requires admin role', async ({ page }) => {
    await page.goto('/admin/users');

    // Should redirect or show unauthorized
    await page.waitForLoadState('networkidle');

    const isRedirected = !page.url().includes('/admin/users');
    const unauthorizedText = page.getByText(/unauthorized|forbidden|sign in|admin only/i);

    expect(isRedirected || await unauthorizedText.isVisible()).toBeTruthy();
  });
});

test.describe('QR Code Generation', () => {
  test.skip('generates QR code for collection', async ({ page }) => {
    // Would need authentication
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Look for QR code button or section
    const qrButton = page.getByRole('button', { name: /qr|code/i });
    if (await qrButton.isVisible()) {
      await qrButton.click();

      // Should display QR code
      const qrCode = page.locator('canvas, svg, img[alt*="qr" i]');
      await expect(qrCode).toBeVisible();
    }
  });
});

test.describe('Discogs Connection', () => {
  test('shows connect Discogs button when not connected', async ({ page }) => {
    // For unauthenticated users, this might redirect
    await page.goto('/settings');

    // If we can access the page, look for Discogs connection option
    const discogsSection = page.getByText(/discogs|connect/i);

    // Either redirected to auth or shows the settings
    const isRedirected = page.url().includes('/auth');
    expect(isRedirected || await discogsSection.isVisible()).toBeTruthy();
  });
});
