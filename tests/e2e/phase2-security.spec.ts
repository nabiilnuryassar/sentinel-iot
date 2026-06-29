import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

// ── Test 11: Security events filter by severity ─────────────────
test('security events filter by severity @phase-2', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('/security-events');
  await page.waitForLoadState('networkidle');

  // Look for severity filter
  const severityFilter = page.getByLabel(/severity/i).or(page.locator('select, [role="combobox"]').first());

  if (await severityFilter.isVisible()) {
    await severityFilter.click();
    await page.getByRole('option', { name: /high/i }).or(page.locator('option[value="high"]')).click();
    await page.waitForLoadState('networkidle');

    // Verify the URL contains the filter param
    await expect(page).toHaveURL(/severity=high/i);
  }
});
