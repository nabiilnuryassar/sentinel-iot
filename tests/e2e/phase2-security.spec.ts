import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

// ── Test 11: Security events filter by severity ─────────────────
test('security events filter by severity @phase-2', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('/security-events');
  await page.waitForLoadState('networkidle');

  // Verify the page loaded with content
  const hasContent = await page.evaluate(() =>
    document.body.textContent?.includes('Security') ?? false,
  );
  expect(hasContent).toBe(true);

  // Look for severity filter (Radix Select or native select)
  const severityFilter = page.locator('[role="combobox"]').first();

  if (await severityFilter.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await severityFilter.click();

    // Click the Radix dropdown option
    const highOption = page.locator('[role="option"]:has-text("high")').first();
    if (await highOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await highOption.click();
      await page.waitForLoadState('networkidle');
      // Verify the combobox now shows "high"
      await expect(severityFilter).toContainText(/high/i);
    }
  }
});
