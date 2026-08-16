import { statSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { chromium } from '@playwright/test';

// Record the Coraza audit-log size before the run so the teardown can report only
// THIS run's rule fires (the log appends; we never truncate it). Only active when
// running through the proxy — set SMOKE_WAF_AUDIT_LOG or rely on the sibling default.
const auditLog = process.env.SMOKE_WAF_AUDIT_LOG || resolve(process.cwd(), '../protostar-proxy/coraza-audit.log');
const marker = resolve(process.cwd(), '.waf-audit-offset');

// Perimeter gate is now a caddy-security cookie/form portal at /auth/, not HTTP
// Basic — there's no browser-native prompt to intercept, so we log in once with a
// real (headless) browser through the LOCAL-auth form and save the resulting
// session as storageState for every test to reuse. We never drive Google's own
// login UI here: that needs a real Google account and its own consent/2FA screens,
// impractical for headless smoke runs — Google SSO is exercised manually instead.
// An unreachable proxy or a rejected login would otherwise burn every test's full
// timeout instead of reporting the real cause, so this fails fast up front.
const authStateFile = resolve(process.cwd(), '.auth-state.json');

async function loginAndSaveState(): Promise<void> {
  const base = process.env.SMOKE_BASE_URL;
  const user = process.env.SMOKE_GATE_USER;
  if (!base || !user) return;
  const pass = process.env.SMOKE_GATE_PASS || '';

  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  try {
    // caddy-security's local login is a TWO-step flow: page 1 collects the
    // username (realm defaults to local), then a sandbox page collects the
    // password (field id `secret`). /auth/ redirects to /auth/login.
    await page.goto(`${base}/auth/`);
    // When more than one backend is enabled (e.g. Google SSO on), the portal
    // hides the local form behind a "showLoginForm('local')" toggle; local-only
    // deployments show it directly. Reveal it if it isn't already visible.
    const username = page.locator('#username');
    if (!(await username.isVisible())) {
      await page.locator('a[onclick^="showLoginForm(\'local\'"]').first().click();
      await username.waitFor({ state: 'visible', timeout: 5_000 });
    }
    await username.fill(user);
    await Promise.all([
      page.waitForURL(/\/auth\/sandbox\//, { timeout: 10_000 }),
      page.locator('button[type="submit"]').click(),
    ]);
    await page.locator('#secret').fill(pass);
    await Promise.all([
      // On success the sandbox flow finalizes the session and leaves /auth/sandbox/
      // (landing on the portal or the original destination).
      page.waitForURL((url) => !url.pathname.includes('/auth/sandbox/'), { timeout: 10_000 }),
      page.locator('button[type="submit"]').click(),
    ]);
    // Confirm we actually hold a session, not just that the URL changed.
    const cookies = await context.cookies();
    if (!cookies.some((c) => c.name === 'AUTHP_SESSION_ID' || c.name === 'AUTHP_ACCESS_TOKEN')) {
      throw new Error('no session cookie after submit');
    }
    await context.storageState({ path: authStateFile });
  } catch (err) {
    throw new Error(
      `Perimeter gate login failed for SMOKE_GATE_USER='${user}' at ${base}/auth/ ` +
      `(${err instanceof Error ? err.message : String(err)}). ` +
      'Check SMOKE_GATE_USER/SMOKE_GATE_PASS against the local-users.conf account, ' +
      'and that the proxy is running.'
    );
  } finally {
    await browser.close();
  }
}

export default async function globalSetup() {
  await loginAndSaveState();
  let offset = 0;
  try { offset = statSync(auditLog).size; } catch { /* no audit log yet */ }
  writeFileSync(marker, JSON.stringify({ log: auditLog, offset }));
}
