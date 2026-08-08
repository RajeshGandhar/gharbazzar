import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isRemote = !BASE_URL.includes("localhost") && !BASE_URL.includes("127.0.0.1");

// When testing against a Vercel deployment that has Deployment Protection enabled,
// pass the bypass secret so automated tests can reach the app without SSO.
// Set VERCEL_AUTOMATION_BYPASS_SECRET in Vercel project env vars, then export it
// locally before running: export VERCEL_AUTOMATION_BYPASS_SECRET=<secret>
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHeaders = isRemote && bypassSecret
  ? { "x-vercel-protection-bypass": bypassSecret }
  : {};

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    extraHTTPHeaders: extraHeaders,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Only start a local server when targeting localhost.
  // Set PLAYWRIGHT_BASE_URL=https://gharbazaar.in to test against production.
  webServer: isRemote
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
