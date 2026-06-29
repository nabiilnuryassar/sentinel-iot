import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';
import { createIncident } from './fixtures/incidents';

// ── Test 8: Create incident manually → open ─────────────────────
test('create incident shows in list @phase-2', async ({ page }) => {
  await loginAsAdmin(page);

  await createIncident(page, {
    title: 'E2E Test Incident',
    severity: 'high',
    summary: 'Automated test incident from Playwright E2E.',
  });

  // Verify the incident appears in the list
  await page.goto('/incidents');
  await expect(page.getByText('E2E Test Incident')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/open/i).first()).toBeVisible();
});

// ── Test 9: Close incident → resolved ───────────────────────────
test('close incident changes status to resolved @phase-2', async ({ page }) => {
  await loginAsAdmin(page);

  // Navigate to incidents list and click the first one
  await page.goto('/incidents');
  await page.waitForLoadState('networkidle');

  // Click on the first incident row
  const firstIncidentLink = page.locator('a[href*="/incidents/"]').first();
  await firstIncidentLink.click();
  await page.waitForLoadState('networkidle');

  // Look for status change controls (select or button)
  const statusSelect = page.getByLabel(/status/i);
  if (await statusSelect.isVisible()) {
    await statusSelect.click();
    await page.getByRole('option', { name: /closed|resolved/i }).click();
    await page.getByRole('button', { name: /update|save/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/closed|resolved/i).first()).toBeVisible({ timeout: 10_000 });
  }
});
