import { test, expect } from '@playwright/test';

// Note: These tests require authentication. In a real scenario,
// you would set up authentication state before running these tests.
// For now, we test unauthenticated behavior.

test.describe('Settings Page', () => {
  test.describe('unauthenticated access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Should redirect to /auth/signin
      expect(page.url()).toContain('/auth/signin');
    });
  });

  test.describe('settings page structure', () => {
    // This test would normally require authentication setup
    // Using test.skip for unauthenticated testing
    test.skip('displays settings form when authenticated', async ({ page }) => {
      // In a real test, you would authenticate first
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Should have settings form elements
      await expect(page.getByLabel(/display name/i)).toBeVisible();
      await expect(page.getByLabel(/bio/i)).toBeVisible();
      await expect(page.getByLabel(/public/i)).toBeVisible();
    });

    test.skip('can update display name', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      const displayNameInput = page.getByLabel(/display name/i);
      await displayNameInput.fill('Test User Updated');

      const saveButton = page.getByRole('button', { name: /save/i });
      await saveButton.click();

      // Should show success message
      await expect(page.getByText(/saved|updated|success/i)).toBeVisible();
    });

    test.skip('can toggle public collection setting', async ({ page }) => {
      await page.goto('/dashboard/settings');
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
    await page.waitForLoadState('networkidle');

    // Should redirect to /auth/signin
    expect(page.url()).toContain('/auth/signin');
  });

  test('admin users page requires authentication', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Should redirect to /auth/signin
    expect(page.url()).toContain('/auth/signin');
  });
});

test.describe('QR Code Generation', () => {
  test.skip('generates QR code for collection', async ({ page }) => {
    // Would need authentication
    await page.goto('/dashboard/qr');
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
  test('redirects to auth when checking Discogs connection unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Should redirect to /auth/signin
    expect(page.url()).toContain('/auth/signin');
  });
});
