import { statSync, writeFileSync } from 'fs';
import { request } from 'https';
import { resolve } from 'path';

// Record the Coraza audit-log size before the run so the teardown can report only
// THIS run's rule fires (the log appends; we never truncate it). Only active when
// running through the proxy — set SMOKE_WAF_AUDIT_LOG or rely on the sibling default.
const auditLog = process.env.SMOKE_WAF_AUDIT_LOG || resolve(process.cwd(), '../protostar-proxy/coraza-audit.log');
const marker = resolve(process.cwd(), '.waf-audit-offset');

// Preflight the proxy before any test runs: an unreachable proxy or a gate 401
// serves a body that never renders the login form, so every test would burn its
// full timeout instead of reporting the real cause.
function checkGate(): Promise<void> {
  const base = process.env.SMOKE_BASE_URL;
  const user = process.env.SMOKE_GATE_USER;
  if (!base || !user) return Promise.resolve();
  return new Promise((done, fail) => {
    const req = request(base, {
      method: 'HEAD',
      rejectUnauthorized: false,
      auth: `${user}:${process.env.SMOKE_GATE_PASS || ''}`,
    }, res => {
      res.resume();
      if (res.statusCode === 401) {
        fail(new Error(`Perimeter gate rejected SMOKE_GATE_USER='${user}' (401 from ${base}). ` +
          'Fix SMOKE_GATE_USER/SMOKE_GATE_PASS, or the basic_auth hash in the Caddyfile.'));
      } else {
        done();
      }
    });
    req.on('error', err => fail(new Error(`Cannot reach ${base} (${err.message}). Is the proxy running?`)));
    req.end();
  });
}

export default async function globalSetup() {
  await checkGate();
  let offset = 0;
  try { offset = statSync(auditLog).size; } catch { /* no audit log yet */ }
  writeFileSync(marker, JSON.stringify({ log: auditLog, offset }));
}
