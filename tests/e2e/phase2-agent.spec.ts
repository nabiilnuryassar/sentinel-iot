import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

// AI agent requires API keys not present in test env.
// Verify the page loads and the form is present instead.
test('AI agent page loads with form @phase-2', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('/agent');
  await page.waitForLoadState('networkidle');

  // Verify the agent page renders (not a 500/error page)
  await expect(page.locator('body')).toBeVisible();
  await expect(page).not.toHaveTitle(/500|error/i);

  // The agent console should have an input area
  const hasInput = await page.locator('textarea, input[type="text"]').first().isVisible({ timeout: 5_000 }).catch(() => false);
  expect(hasInput).toBe(true);
});
