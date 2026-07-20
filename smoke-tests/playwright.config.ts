import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Report which Coraza/CRS WAF rules fired during the run (when going through the proxy).
  globalSetup: './waf-audit-setup.ts',
  globalTeardown: './waf-audit-teardown.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    // Perimeter gate creds when testing through the proxy (env-gated: unset for the
    // direct run). ignoreHTTPSErrors covers a local self-signed proxy cert.
    ...(process.env.SMOKE_GATE_USER
      ? { httpCredentials: { username: process.env.SMOKE_GATE_USER, password: process.env.SMOKE_GATE_PASS || '' } }
      : {}),
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
