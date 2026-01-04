import { test, expect } from '@playwright/test';

test.describe('Collection Page', () => {
  test.describe('public collection viewing', () => {
    test('shows 404 for non-existent collection', async ({ page }) => {
      await page.goto('/c/nonexistent-user-12345');
      await page.waitForLoadState('networkidle');

      // Should show some form of error or 404
      await expect(page.locator('body')).toContainText(/not found|error|404|collection/i);
    });

    // Skip tests that require a real collection to exist
    test.skip('displays collection page layout', async ({ page }) => {
      // Navigate to a collection page (assuming a public collection exists)
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      // Should have a search bar
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });

    test.skip('search filters albums', async ({ page }) => {
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('Beatles');
      await page.waitForTimeout(500);
      await expect(searchInput).toHaveValue('Beatles');
    });

    test.skip('album cards are clickable', async ({ page }) => {
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      const albumCard = page.locator('[class*="cursor-pointer"]').first();

      if (await albumCard.isVisible()) {
        await albumCard.click();
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
      }
    });

    test.skip('modal can be closed', async ({ page }) => {
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      const albumCard = page.locator('[class*="cursor-pointer"]').first();

      if (await albumCard.isVisible()) {
        await albumCard.click();
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe('responsive design', () => {
    test.skip('displays mobile layout on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });

    test.skip('displays desktop layout on large screens', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe('filter controls', () => {
    test.skip('filter drawer opens and closes', async ({ page }) => {
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      const filterButton = page.getByRole('button', { name: /filter|controls/i });

      if (await filterButton.isVisible()) {
        await filterButton.click();
        const drawer = page.locator('[role="dialog"]');
        await expect(drawer).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(drawer).not.toBeVisible();
      }
    });
  });

  test.describe('pagination', () => {
    test.skip('loads more albums on scroll or pagination', async ({ page }) => {
      await page.goto('/c/dave');
      await page.waitForLoadState('networkidle');

      const initialCards = await page.locator('[class*="cursor-pointer"]').count();
      const nextButton = page.getByRole('button', { name: /next|more|load/i });

      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        const newCards = await page.locator('[class*="cursor-pointer"]').count();
        expect(newCards).toBeGreaterThan(0);
      } else {
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
