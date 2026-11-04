import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 180000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: 'list',
  outputDir: '.animation-test-results',
  use: {
    baseURL: process.env.ANIMATION_TEST_URL || 'http://localhost:3003',
    channel: process.platform === 'win32' && !process.env.CI ? 'msedge' : undefined,
    headless: true,
    acceptDownloads: true,
    viewport: { width: 1440, height: 1100 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});