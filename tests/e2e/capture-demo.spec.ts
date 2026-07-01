import { test } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

const outDir = '/tmp/demo-screenshots';

test('capture all demo pages', async ({ page }) => {
  // 1. Landing
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/01-landing.png` });

  // 2. Login
  await page.goto('/login');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}/02-login.png` });

  // 3. Login and go to dashboard
  await loginAsAdmin(page);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/03-dashboard.png` });

  // 4. Devices
  await page.goto('/devices');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/04-devices.png` });

  // 5. Device detail - click first device
  const deviceLink = page.locator('a[href*="/devices/"]').first();
  if (await deviceLink.isVisible()) {
    await deviceLink.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/05-device-detail.png` });
  }

  // 6. Security Events
  await page.goto('/security-events');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/06-security-events.png` });

  // 7. Incidents
  await page.goto('/incidents');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/07-incidents.png` });

  // 8. Telemetry
  await page.goto('/telemetry');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/08-telemetry.png` });

  // 9. Agent
  await page.goto('/agent');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/09-agent.png` });
});
