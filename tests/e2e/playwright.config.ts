import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  fullyParallel: false, // Sequential — tests share Docker state
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'tests/e2e/playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d',
    url: 'http://localhost:8000/api/health',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'phase-1', testMatch: /phase1.*\.spec\.ts/, grep: /@phase-1/ },
    { name: 'phase-2', testMatch: /phase2.*\.spec\.ts/, grep: /@phase-2/ },
    { name: 'phase-3', testMatch: /phase3.*\.spec\.ts/, grep: /@phase-3/ },
    { name: 'full', grep: /@phase-[123]/ },
  ],
});
