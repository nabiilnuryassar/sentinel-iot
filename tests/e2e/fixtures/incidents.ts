import type { Page } from '@playwright/test';

/**
 * Create an incident via the Inertia form and return to the incidents list.
 */
export async function createIncident(
  page: Page,
  opts: { title: string; severity: string; summary?: string; deviceId?: string },
): Promise<void> {
  await page.goto('/incidents');
  await page.getByRole('button', { name: /new incident/i }).click();

  // Fill the dialog form
  await page.getByLabel(/title/i).fill(opts.title);
  await page.getByLabel(/severity/i).click();
  await page.getByRole('option', { name: opts.severity }).click();

  if (opts.summary) {
    await page.getByLabel(/summary/i).fill(opts.summary);
  }
  if (opts.deviceId) {
    await page.getByLabel(/device/i).fill(opts.deviceId);
  }

  await page.getByRole('button', { name: /create|save|submit/i }).click();
  await page.waitForLoadState('networkidle');
}
