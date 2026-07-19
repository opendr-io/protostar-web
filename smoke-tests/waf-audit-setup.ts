import { statSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Record the Coraza audit-log size before the run so the teardown can report only
// THIS run's rule fires (the log appends; we never truncate it). Only active when
// running through the proxy — set SMOKE_WAF_AUDIT_LOG or rely on the sibling default.
const auditLog = process.env.SMOKE_WAF_AUDIT_LOG || resolve(process.cwd(), '../protostar-proxy/coraza-audit.log');
const marker = resolve(process.cwd(), '.waf-audit-offset');

export default function globalSetup() {
  let offset = 0;
  try { offset = statSync(auditLog).size; } catch { /* no audit log yet */ }
  writeFileSync(marker, JSON.stringify({ log: auditLog, offset }));
}
