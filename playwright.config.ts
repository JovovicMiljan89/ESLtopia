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

  timeout: 60_000,

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
    {
      // Cross-browser coverage for UI-rendering tests only. Excluded here:
      //   - classes.spec.ts / profile.spec.ts: pure REST/RLS assertions via
      //     the `request` fixture, no page rendering at all -- running them
      //     under every engine would just re-send identical HTTP calls three
      //     times for zero additional signal.
      //   - tests/visual/**: toHaveScreenshot() baselines only exist for
      //     Chromium (see the Test Plan) -- Firefox/WebKit would fail on a
      //     missing baseline, not a real regression.
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/app/classes.spec.ts', '**/app/profile.spec.ts', '**/visual/**'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/app/classes.spec.ts', '**/app/profile.spec.ts', '**/visual/**'],
    },
  ],

  // No webServer: tests hit a live deployment, not a local dev server.
});
