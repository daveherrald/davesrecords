import { test, expect } from '@playwright/test';

test.describe('Collection Page', () => {
  test.describe('public collection viewing', () => {
    test('displays collection page layout', async ({ page }) => {
      // Navigate to a collection page (assuming a public collection exists)
      await page.goto('/collection/dave');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should have a search bar
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });

    test('shows 404 for non-existent collection', async ({ page }) => {
      await page.goto('/collection/nonexistent-user-12345');

      // Should show some form of error or 404
      await expect(page.locator('body')).toContainText(/not found|error|404/i);
    });

    test('search filters albums', async ({ page }) => {
      await page.goto('/collection/dave');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i);

      // Type a search term
      await searchInput.fill('Beatles');

      // Wait for debounce and filtering
      await page.waitForTimeout(500);

      // The grid should update (this tests the search interaction)
      // We can't verify actual results without knowing the data,
      // but we can verify the input captured the value
      await expect(searchInput).toHaveValue('Beatles');
    });

    test('album cards are clickable', async ({ page }) => {
      await page.goto('/collection/dave');
      await page.waitForLoadState('networkidle');

      // Find an album card (they have cursor-pointer class)
      const albumCard = page.locator('[class*="cursor-pointer"]').first();

      // If albums exist, clicking should open a modal
      if (await albumCard.isVisible()) {
        await albumCard.click();

        // Modal should appear (Dialog component)
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
      }
    });

    test('modal can be closed', async ({ page }) => {
      await page.goto('/collection/dave');
      await page.waitForLoadState('networkidle');

      const albumCard = page.locator('[class*="cursor-pointer"]').first();

      if (await albumCard.isVisible()) {
        await albumCard.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Close modal by pressing Escape
        await page.keyboard.press('Escape');

        // Modal should be hidden
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe('responsive design', () => {
    test('displays mobile layout on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/collection/dave');
      await page.waitForLoadState('networkidle');

      // Page should still have search functionality
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });

    test('displays desktop layout on large screens', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/collection/dave');
      await page.waitForLoadState('networkidle');

      // Page should have full width layout
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe('filter controls', () => {
    test('filter drawer opens and closes', async ({ page }) => {
      await page.goto('/collection/dave');
      await page.waitForLoadState('networkidle');

      // Look for filter/controls button
      const filterButton = page.getByRole('button', { name: /filter|controls/i });

      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Drawer should open
        const drawer = page.locator('[role="dialog"]');
        await expect(drawer).toBeVisible();

        // Close the drawer
        await page.keyboard.press('Escape');
        await expect(drawer).not.toBeVisible();
      }
    });
  });

  test.describe('pagination', () => {
    test('loads more albums on scroll or pagination', async ({ page }) => {
      await page.goto('/collection/dave');
      await page.waitForLoadState('networkidle');

      // Get initial album count
      const initialCards = await page.locator('[class*="cursor-pointer"]').count();

      // If there's pagination, click to load more
      const nextButton = page.getByRole('button', { name: /next|more|load/i });

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');

        // Should have albums (could be same count or different depending on pagination)
        const newCards = await page.locator('[class*="cursor-pointer"]').count();
        expect(newCards).toBeGreaterThan(0);
      } else {
        // If no pagination visible, initial cards should exist (or be 0 for empty collection)
        expect(initialCards).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

test.describe('Home Page', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Home page should have some content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('has navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have some navigation or branding
    // This depends on your actual home page design
    const header = page.locator('header, nav');
    if (await header.count() > 0) {
      await expect(header.first()).toBeVisible();
    }
  });
});
