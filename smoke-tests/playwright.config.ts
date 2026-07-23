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
    // Perimeter gate session when testing through the proxy (env-gated: unset for
    // the direct run). The gate is a caddy-security cookie/form portal, not HTTP
    // Basic, so the session comes from a cookie captured by waf-audit-setup.ts's
    // globalSetup (logs in through the portal's local-auth form once) rather than
    // Playwright's httpCredentials. ignoreHTTPSErrors covers a local self-signed
    // proxy cert.
    ...(process.env.SMOKE_GATE_USER ? { storageState: '.auth-state.json' } : {}),
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
