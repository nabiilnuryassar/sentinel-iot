import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';
import { submitAgentPrompt } from './fixtures/agent';

// ── Test 10: AI agent prompt → response renders ─────────────────
test('AI agent responds to prompt @phase-2', async ({ page }) => {
  await loginAsAdmin(page);

  await submitAgentPrompt(page, 'What is the current risk level?');

  // Verify some response content appeared
  // The agent console should render a response area
  await expect(page.locator('[class*="message"], [class*="response"], [class*="chat"], pre, article').first())
    .toBeVisible({ timeout: 15_000 });
});
