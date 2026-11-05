import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4310',
    locale: 'es-ES',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] }, testMatch: /a11y/ },
  ],
  webServer: {
    command: 'npx ng serve --port 4310',
    url: 'http://localhost:4310',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
