import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a production build. Requires a seeded database:
 *   npm run build && npm run db:seed && npx playwright test
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3100",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx next start -p 3100",
        port: 3100,
        reuseExistingServer: true,
        timeout: 60_000,
        env: { APP_URL: "http://localhost:3100", ALLOW_LOCAL_STORAGE_IN_PRODUCTION: "true", DEMO_MODE: "true" },
      },
});
