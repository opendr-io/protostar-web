import { expect, test, APIRequestContext, request as apiRequest } from '@playwright/test';
import net from 'node:net';

// Proxy security smoke tests. Three groups:
//   1. WAF Cypher hard-blocks on the browser Cypher channel (/neo4j) — Caddyfile
//      rules id:1000/1001/1003.
//   2. Perimeter-gate coverage — unauthenticated access to the service URIs must be
//      blocked (redirected to the login portal), so backends can't be reached by
//      hitting the proxy directly without logging in.
//   3. Backend isolation (REMOTE ONLY) — the backend ports (Flask/Neo4j-HTTP/Bolt)
//      must not be reachable off-box; only the proxy (:8443) is network-exposed.
//      Skipped against localhost, where loopback makes them reachable by design.
//
// Proxy-only: skipped in the direct (no-proxy) run, since there's no proxy then.
// The WAF group requires Coraza ENFORCING (start-proxy.py default --coraza On) —
// under DetectionOnly/Off the payloads pass and the "blocked" cases will (correctly)
// fail. Groups 2 and 3 are WAF-mode-independent (they test authorization / network
// exposure, not the WAF).
//
// /neo4j is now behind the perimeter gate too (authorize with gatepolicy) — these
// POSTs ride the shared session cookie from globalSetup's storageState (Playwright's
// `request` fixture inherits `use.storageState`), same as every other test here.
// Coraza itself still runs first regardless of gate status (`order coraza_waf
// first`), so blocked payloads 403 before ever reaching authorization or Neo4j.
// We assert only block-vs-pass: a WAF denial is 403; a passed request clears the
// gate, reaches Neo4j, and returns 401 (these tests send no Neo4j creds). Blocked
// payloads never reach the DB, and the "allowed" cases are reads, so nothing
// mutates the graph.

const proxied = (process.env.SMOKE_BASE_URL || '').startsWith('https');
const describe = proxied ? test.describe : test.describe.skip;

const NEO = '/neo4j/tx/commit';
const jsonBody = (statement: string) => JSON.stringify({ statements: [{ statement }] });

async function post(request: APIRequestContext, url: string, rawBody: string) {
  return request.post(url, { headers: { 'Content-Type': 'application/json' }, data: rawBody });
}

describe('WAF Cypher hard-blocks (/neo4j)', () => {
  // Payloads the WAF must DENY (403). id:1000 writes/DDL/admin/procedure, id:1001 traversal.
  const blocked: Record<string, string> = {
    'CREATE (write)': 'CREATE (x:Pwn) RETURN x',
    'MERGE (write)': 'MERGE (x:Pwn) RETURN x',
    'SET (write)': 'MATCH (n) SET n.pwned = 1',
    'DETACH DELETE (write)': 'MATCH (n) DETACH DELETE n',
    'CALL apoc (procedure / SSRF)': 'CALL apoc.load.json("http://169.254.169.254/")',
    'GRANT (admin / system db)': 'GRANT ROLE admin TO foo',
    'unbounded [*] (traversal bomb)': 'MATCH (n)-[*]->(m) RETURN m',
  };
  for (const [name, statement] of Object.entries(blocked)) {
    test(`blocks ${name}`, async ({ request }) => {
      const res = await post(request, NEO, jsonBody(statement));
      expect(res.status(), `${name} should be blocked by the WAF`).toBe(403);
    });
  }

  // JSON-unicode evasion: the wire body carries CREATE (single backslash);
  // Neo4j decodes it to CREATE, and Coraza's t:jsDecode must too, so it still 403s.
  // Hand-built raw body so JSON.stringify doesn't re-escape the backslash.
  test('blocks unicode-escaped CREATE (t:jsDecode evasion)', async ({ request }) => {
    const rawBody = '{"statements":[{"statement":"\\u0043REATE (x) RETURN x"}]}';
    const res = await post(request, NEO, rawBody);
    expect(res.status(), 'unicode-escaped CREATE should still be blocked').toBe(403);
  });

  // System-db access to the admin database (id:1003). NOTE: the `..`/`%2e%2e`
  // traversal form can't be tested here — Playwright's HTTP client normalizes it
  // away before sending, so it never reaches the proxy un-collapsed. That form is
  // verified manually with `curl --path-as-is`. This asserts the plain system-db
  // path, which the client sends faithfully.
  test('blocks plain system-db path', async ({ request }) => {
    const res = await post(request, '/neo4j/db/system/tx/commit', jsonBody('MATCH (n) RETURN n'));
    expect(res.status(), 'system-db path should be blocked by the WAF').toBe(403);
  });

  // Legit reads the neo app actually sends must PASS the WAF (not 403). Without
  // Neo4j creds these reach the DB and return 401 — the point is they're not denied.
  const allowed: Record<string, string> = {
    'MATCH ... RETURN': 'MATCH (n:ENTITY) WHERE n.view = 1 RETURN n LIMIT 1',
    'bounded [*..3] traversal': 'MATCH (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(m) RETURN m LIMIT 1',
  };
  for (const [name, statement] of Object.entries(allowed)) {
    test(`allows ${name}`, async ({ request }) => {
      const res = await post(request, NEO, jsonBody(statement));
      expect(res.status(), `${name} should NOT be blocked by the WAF`).not.toBe(403);
    });
  }
});

// Gate coverage: the perimeter gate must block UNAUTHENTICATED access to every
// service URI, so the backends can't be reached by hitting the proxy directly
// without logging in. A fresh request context carries NO session cookie (it
// deliberately bypasses use.storageState), so each gated route should bounce to the
// login portal. Mode-independent — holds regardless of the Coraza WAF mode.
describe('Perimeter gate blocks unauthenticated access', () => {
  let anon: APIRequestContext;
  test.beforeAll(async () => {
    // Empty storageState => no session cookie. A plain newContext() would inherit
    // the config's use.storageState (the logged-in session), so we override it to
    // make these requests genuinely unauthenticated.
    anon = await apiRequest.newContext({
      baseURL: process.env.SMOKE_BASE_URL,
      ignoreHTTPSErrors: true,
      storageState: { cookies: [], origins: [] },
    });
  });
  test.afterAll(async () => { await anon.dispose(); });

  const gated: Array<{ name: string; method: 'GET' | 'POST'; uri: string }> = [
    { name: 'React app (/)', method: 'GET', uri: '/' },
    { name: 'graph SPA (/graph/)', method: 'GET', uri: '/graph/' },
    { name: 'Flask API (/api/getallcases)', method: 'GET', uri: '/api/getallcases' },
    { name: 'Neo4j (/neo4j/tx/commit)', method: 'POST', uri: NEO },
  ];
  for (const { name, method, uri } of gated) {
    test(`blocks unauthenticated ${name}`, async () => {
      // Follow redirects: an unauthenticated request must be bounced to the login
      // portal, so it lands on /auth — never served backend content directly.
      const res = method === 'POST'
        ? await anon.post(uri, { headers: { 'Content-Type': 'application/json' }, data: jsonBody('MATCH (n) RETURN n LIMIT 1') })
        : await anon.get(uri);
      expect(res.url(), `${name} should be redirected to the gate (/auth)`).toContain('/auth');
    });
  }

  // The login page itself is public — you can't gate the gate.
  test('allows the login page (/auth/login)', async () => {
    const res = await anon.get('/auth/login');
    expect(res.ok(), '/auth/login should be reachable').toBeTruthy();
    expect(res.url(), '/auth/login stays on the portal').toContain('/auth');
  });
});

// Backend isolation: only the proxy (:8443) should be reachable over the network —
// the backends bind 127.0.0.1, so a direct connection to them from a remote client
// must fail. This is meaningful ONLY when the target is remote: against localhost the
// backends are reachable by design (loopback), so we skip. Run this from a DIFFERENT
// machine (SMOKE_BASE_URL=https://<server>:8443) to actually exercise it.
const baseHost = (() => { try { return new URL(process.env.SMOKE_BASE_URL || '').hostname; } catch { return ''; } })();
const targetIsLocal = ['', 'localhost', '127.0.0.1', '::1', '[::1]'].includes(baseHost);
const remoteDescribe = (proxied && !targetIsLocal) ? test.describe : test.describe.skip;

// Raw TCP connect: does the port accept a connection from this (remote) client?
// A successful connect means the port is network-exposed; a refused or timed-out
// connection is the desired outcome. Protocol-agnostic, so it covers both the HTTP
// backends and Bolt (which isn't HTTP) uniformly.
function portReachable(host: string, port: number, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (reachable: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(reachable);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

remoteDescribe('Backend services are not directly reachable (remote only)', () => {
  // The proxy fronts Flask/Neo4j-HTTP on 127.0.0.1 (Caddyfile reverse_proxy targets);
  // Neo4j Bolt (:7687) is loopback-bound too and never proxied at all. None should be
  // reachable from a remote client — only the proxy (:8443) is network-exposed.
  const backends = [
    { name: 'Flask API', port: 5002 },
    { name: 'Neo4j HTTP', port: 7474 },
    { name: 'Neo4j Bolt', port: 7687 },
  ];
  for (const { name, port } of backends) {
    test(`${name} (:${port}) is not reachable directly`, async () => {
      const reachable = await portReachable(baseHost, port);
      expect(reachable, `${name} on ${baseHost}:${port} should NOT be reachable off-box — only the proxy should be`).toBe(false);
    });
  }
});
