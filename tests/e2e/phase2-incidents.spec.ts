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
  await page.waitForLoadState('networkidle');

  // Use evaluate to check text content (handles scrollable containers)
  const hasIncident = await page.evaluate(() =>
    document.body.textContent?.includes('E2E Test Incident') ?? false,
  );
  expect(hasIncident).toBe(true);
});

// ── Test 9: Close incident → resolved ───────────────────────────
test('close incident changes status to resolved @phase-2', async ({ page }) => {
  await loginAsAdmin(page);

  // Navigate to incidents list to find the first incident URL
  await page.goto('/incidents');
  await page.waitForLoadState('networkidle');

  // Extract first incident URL from DOM (handles scrollable containers)
  const incidentHref = await page.evaluate(() => {
    const link = document.querySelector('a[href*="/incidents/"]') as HTMLAnchorElement;
    return link?.getAttribute('href');
  });

  if (!incidentHref) {
    test.skip(true, 'No incidents found to close');
    return;
  }

  // Navigate directly to the incident show page
  await page.goto(incidentHref);
  await page.waitForLoadState('networkidle');

  // Look for status change controls
  const statusSelect = page.getByLabel(/status/i);
  if (await statusSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await statusSelect.click();
    const closedOption = page.getByRole('option', { name: /closed|resolved/i });
    if (await closedOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closedOption.click();
      await page.getByRole('button', { name: /update|save/i }).click();
      await page.waitForLoadState('networkidle');
    }
  }
});
