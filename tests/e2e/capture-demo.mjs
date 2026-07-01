import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:8000';
const outDir = '/tmp/demo-screenshots';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. Landing
await page.goto(BASE);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/01-landing.png` });
console.log('✓ 01-landing');

// 2. Login
await page.goto(`${BASE}/login`);
await page.waitForTimeout(1000);
await page.screenshot({ path: `${outDir}/02-login.png` });
console.log('✓ 02-login');

// 3. Do login
await page.fill('#email', 'admin@sentinel.local');
await page.fill('#password', 'password');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 10000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/03-dashboard.png` });
console.log('✓ 03-dashboard');

// 4. Devices
await page.goto(`${BASE}/devices`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/04-devices.png` });
console.log('✓ 04-devices');

// 5. Device detail
const deviceLink = page.locator('a[href*="/devices/"]').first();
if (await deviceLink.isVisible({ timeout: 3000 }).catch(() => false)) {
  await deviceLink.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${outDir}/05-device-detail.png` });
  console.log('✓ 05-device-detail');
} else {
  console.log('⊘ 05-device-detail (no device links)');
}

// 6. Security Events
await page.goto(`${BASE}/security-events`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/06-security-events.png` });
console.log('✓ 06-security-events');

// 7. Incidents
await page.goto(`${BASE}/incidents`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/07-incidents.png` });
console.log('✓ 07-incidents');

// 8. Telemetry
await page.goto(`${BASE}/telemetry`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/08-telemetry.png` });
console.log('✓ 08-telemetry');

// 9. Agent
await page.goto(`${BASE}/agent`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/09-agent.png` });
console.log('✓ 09-agent');

await browser.close();
console.log(`\n✅ All screenshots saved to ${outDir}/`);
