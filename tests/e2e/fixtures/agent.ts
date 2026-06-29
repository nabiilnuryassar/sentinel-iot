import type { Page } from '@playwright/test';

/**
 * Submit a prompt to the AI agent console and wait for the response to render.
 */
export async function submitAgentPrompt(page: Page, prompt: string): Promise<void> {
  await page.goto('/agent');
  await page.waitForLoadState('networkidle');

  const textarea = page.getByPlaceholder(/ask|prompt|message/i);
  await textarea.fill(prompt);
  await page.getByRole('button', { name: /send|ask|submit/i }).click();

  // Wait for the response area to populate (SSE or form submit)
  await page.waitForTimeout(5_000);
}
