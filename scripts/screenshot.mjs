import { chromium } from 'playwright';

const BASE = 'http://localhost:8000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  console.log('Login page loaded');
  
  // Get form content for debugging
  const html = await page.content();
  console.log('Has email field:', html.includes('email'));
  
  await page.fill('input[name="email"]', 'admin@sentinel.local');
  await page.fill('input[name="password"]', 'password');
  
  // Click submit button
  await page.click('button[type="submit"], form button');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Redirected to dashboard');
  
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'public/images/dashboard-demo.png', fullPage: true });
  console.log('Screenshot saved');

  await browser.close();
})();
