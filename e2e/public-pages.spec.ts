import { expect, test } from '@playwright/test';

test('public pages render with the site metadata', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/MelliVision/i);
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/work', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/MelliVision/i);
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/about', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/MelliVision/i);
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/contact', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/MelliVision/i);
  await expect(page.locator('body')).toBeVisible();
});

test('the login page is reachable without authentication', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('body')).toBeVisible();
});
