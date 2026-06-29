import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';
import { publishTelemetry, publishMalformedPayload } from './fixtures/telemetry';

// ── Test 1: Login page loads ────────────────────────────────────
test('login page loads @phase-1', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Sentinel/);
  await expect(page.getByLabel('email')).toBeVisible();
  await expect(page.getByLabel('password')).toBeVisible();
  await expect(page.getByRole('button', { name: /authenticate/i })).toBeVisible();
});

// ── Test 2: Admin login → redirect to dashboard ─────────────────
test('admin login redirects to dashboard @phase-1', async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page).toHaveURL(/\/dashboard/);
});

// ── Test 3: Dashboard renders summary cards ─────────────────────
test('dashboard renders summary cards @phase-1', async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page.getByText(/total devices/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/online devices/i).first()).toBeVisible();
  await expect(page.getByText(/open incidents/i).first()).toBeVisible();
});

// ── Test 4: Telemetry simulator → device appears online ─────────
test('telemetry simulator shows device online @phase-1', async ({ page }) => {
  await loginAsAdmin(page);

  publishTelemetry('e2e-test-device-001');

  // Wait for ingestor to process the message
  await page.waitForTimeout(3_000);

  await page.goto('/devices');
  await expect(page.getByText('e2e-test-device-001')).toBeVisible({ timeout: 15_000 });
});

// ── Test 5: Malformed payload → security event visible ──────────
test('malformed payload creates security event @phase-1', async ({ page }) => {
  await loginAsAdmin(page);

  publishMalformedPayload('e2e-malformed-device');

  // Wait for ingestor to process
  await page.waitForTimeout(3_000);

  await page.goto('/security-events');
  await expect(page.locator('table').getByText(/malformed/i).first()).toBeVisible({ timeout: 15_000 });
});

// ── Test 6: API health endpoint returns 200 ─────────────────────
test('API health endpoint @phase-1', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.status).toBe('ok');
  expect(body.timestamp).toBeTruthy();
});

// ── Test 7: Logout redirects to login ───────────────────────────
test('logout redirects to login @phase-1', async ({ page }) => {
  test.setTimeout(60_000);
  await loginAsAdmin(page);

  // Sidebar logout button — uses router.post('/logout')
  await page.getByRole('button', { name: /log out/i }).click();

  await page.waitForURL('**/login', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/login/);
});
