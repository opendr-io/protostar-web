import { openSync, fstatSync, readSync, closeSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Read the audit-log bytes appended during this run and report which Coraza/CRS
// rules fired (id + uri + message + count). Prints "no rules fired" when clean.
export default function globalTeardown() {
  const marker = resolve(process.cwd(), '.waf-audit-offset');
  let info: { log: string; offset: number };
  try { info = JSON.parse(readFileSync(marker, 'utf8')); } catch { return; }

  let content = '';
  try {
    const fd = openSync(info.log, 'r');
    const size = fstatSync(fd).size;
    const len = Math.max(0, size - info.offset);
    if (len > 0) {
      const buf = Buffer.alloc(len);
      readSync(fd, buf, 0, len, info.offset);
      content = buf.toString('utf8');
    }
    closeSync(fd);
  } catch {
    console.log('\n[WAF] audit log not found — not running through the proxy? Skipping WAF report.');
    return;
  }

  const fires = content.split('\n').filter(l => l.includes('[id "'));
  if (fires.length === 0) {
    console.log('\n[WAF] No Coraza/CRS rules fired during this run.');
    return;
  }

  const counts = new Map<string, number>();
  for (const line of fires) {
    const id = (line.match(/\[id "(\d+)"\]/) || [])[1] || '?';
    const msg = (line.match(/\[msg "([^"]*)"\]/) || [])[1] || '';
    const uri = (line.match(/\[uri "([^"]*)"\]/) || [])[1] || '';
    const key = [id, uri, msg].join(' | ');
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  console.log(`\n[WAF] ${fires.length} rule fire(s) during this run:`);
  for (const [key, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}x  ${key}`);
  }
}
