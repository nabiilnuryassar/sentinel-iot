import { chromium } from 'playwright';
import { join } from 'path';

const BASE = 'http://127.0.0.1:8899/demo-presentation.html';
const outDir = '/tmp/demo-ppt-slides';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(BASE);
await page.waitForTimeout(2000);

const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`Found ${slideCount} slides`);

// Make ALL slides static and visible for capture
await page.evaluate(() => {
  document.querySelectorAll('.slide').forEach(s => {
    s.style.position = 'relative';
    s.style.opacity = '1';
    s.style.transform = 'none';
    s.style.pointerEvents = 'auto';
    s.style.width = '100vw';
    s.style.height = '100vh';
    s.style.display = 'flex';
    s.style.pageBreakAfter = 'always';
  });
  // Hide all slides except first
  document.querySelectorAll('.slide').forEach((s, i) => {
    if (i > 0) s.style.display = 'none';
  });
});
await page.waitForTimeout(500);

for (let i = 0; i < slideCount; i++) {
  // Show only current slide
  await page.evaluate((idx) => {
    document.querySelectorAll('.slide').forEach((s, j) => {
      s.style.display = j === idx ? 'flex' : 'none';
    });
  }, i);
  await page.waitForTimeout(500);

  const num = String(i + 1).padStart(2, '0');
  await page.screenshot({ path: join(outDir, `slide-${num}.png`), fullPage: false });

  const title = await page.evaluate((idx) => {
    const slide = document.querySelectorAll('.slide')[idx];
    return slide?.querySelector('h1,h2')?.textContent?.trim() || '(no title)';
  }, i);
  console.log(`✓ slide-${num}: ${title}`);
}

await browser.close();
console.log(`\n✅ ${slideCount} slides exported to ${outDir}/`);
