import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Load local Supabase credentials for tests
loadEnv({ path: '.env.test.local', override: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Purge test users once, after all specs finish (see file for why).
  globalTeardown: './tests/global-teardown.ts',

  use: {
    // Tests run against the deployed production site by default.
    // Override with BASE_URL=... to target a preview or local build.
    baseURL: process.env.BASE_URL ?? 'https://esltopia.vercel.app',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer: tests hit a live deployment, not a local dev server.
});
