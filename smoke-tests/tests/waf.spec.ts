import { expect, test, APIRequestContext } from '@playwright/test';

// WAF rule smoke tests — verify the proxy's Coraza hard-blocks on the browser
// Cypher channel (/neo4j), Caddyfile rules id:1000/1001/1003.
//
// Proxy-only: skipped in the direct (no-proxy) run, since there's no WAF then.
// Requires Coraza ENFORCING (start-proxy.ps1 default -CorazaMode On); under
// DetectionOnly/Off the payloads pass and the "blocked" cases will (correctly) fail.
//
// The /neo4j route is gate-exempt, so these POST without the perimeter gate. We
// assert only block-vs-pass: a WAF denial is 403; a passed request reaches Neo4j
// and returns 401 (these tests send no Neo4j creds). Blocked payloads never reach
// the DB, and the "allowed" cases are reads, so nothing mutates the graph.

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
