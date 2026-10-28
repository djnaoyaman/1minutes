import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: /browser\.spec\.js/, timeout: 90000,
  fullyParallel: true, workers: 4, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4173', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
  ],
  webServer: process.env.TEST_BASE_URL ? undefined : { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: false }
});
