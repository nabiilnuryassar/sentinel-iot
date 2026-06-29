import { test as base, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@sentinel.local';
const ADMIN_PASSWORD='password';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('email').fill(ADMIN_EMAIL);
  await page.getByLabel('password').fill(ADMIN_PASSWORD);
  // 500ms pause lets Inertia hydrate the CSRF token before submit
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /authenticate/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
