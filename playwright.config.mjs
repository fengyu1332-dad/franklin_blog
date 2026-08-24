import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

// Dedicated port so e2e never clashes with a running dev/prod server.
const PORT = 3210;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'e2e-admin-pw-2026';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  // Keep artifacts outside the project dir: cloud-sync clients (and sandbox
  // safe-delete shims) can block directory removal inside synced folders.
  outputDir: path.join(os.tmpdir(), 'wb-blog-playwright'),
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node server.mjs',
    env: {
      ADMIN_PASSWORD,
      API_PORT: String(PORT),
      SITE_URL: `http://127.0.0.1:${PORT}`,
    },
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  // Use the system Edge to avoid a large browser download (install Chromium via
  // `npx playwright install chromium` and switch the channel if you prefer).
  projects: [
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
});
