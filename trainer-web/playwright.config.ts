import { defineConfig, devices } from "@playwright/test";

/**
 * Two different URLs are in play, because two different processes do the asking.
 *
 * `webServer.url` is polled by the Playwright runner on this machine, so it has
 * to be localhost. `use.baseURL` is opened by the browser, which locally lives
 * in the playwright container from docker-compose and therefore cannot resolve
 * localhost to this machine. On CI the browsers run in the runner itself, so
 * both collapse to the same address.
 */
const SERVER_URL = "http://localhost:5173";

const browserURL =
  process.env.TESTING_PLAYWRIGHT_BASE_URL ??
  (process.env.CI ? SERVER_URL : "http://host.docker.internal:5173");

const connectOptions = process.env.CI
  ? {}
  : {
      connectOptions: {
        wsEndpoint:
          process.env.TESTING_PLAYWRIGHT_WS_ENDPOINT ?? "ws://localhost:9323",
      },
    };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30 * 1000,
  reporter: "html",
  use: {
    ...{
      ignoreHTTPSErrors: true,
      baseURL: browserURL,
      trace: "on-first-retry",
      screenshot: "only-on-failure",
      testIdAttribute: "data-testid",
    },
    ...connectOptions,
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
      },
    },
  ],
  outputDir: "./playwright/output",
  webServer: [
    {
      url: SERVER_URL,
      // --host binds Vite to all interfaces so the container can reach it.
      command: "pnpm dev --host",
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60 * 1000,
      env: {
        // Every Supabase call is intercepted in e2e/mocks/supabase.ts, so these
        // only have to be present and well formed, never reachable.
        VITE_SUPABASE_URL: "http://localhost:54321",
        VITE_SUPABASE_ANON_KEY: "mock-anon-key",
        VITE_FEATURE_FLAG_DEBUG_SETTINGS_TAB_ENABLED: "false",
      },
    },
  ],
});
