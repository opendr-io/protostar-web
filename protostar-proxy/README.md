# protostar-proxy

Optional reverse proxy (Caddy + Coraza WAF + rate-limit) that fronts all four
Protostar services behind one origin. See `docs/reverse-proxy-design.md` for the
full design. The proxy is **optional** — local dev runs exactly as before without
it (the app config falls back to direct absolute URLs).

## What it does

One origin (`https://<host>:8443`, listens on all interfaces), four routes:

| Path       | Target                        |
|------------|-------------------------------|
| `/`        | React static build            |
| `/api/*`   | Flask on `127.0.0.1:5002`     |
| `/graph/*` | protostar-neo static build    |
| `/neo4j/*` | Neo4j HTTP `127.0.0.1:7474/db/neo4j` (`POST …/tx/commit`) |

Plus: a `basic_auth` perimeter gate on the app shell, a Coraza WAF (blocks Cypher
writes/DDL and unbounded `[*]` traversals on `/neo4j`), and rate limiting.

## Prerequisites

- Caddy installed on the host (Chocolatey) — used only for `caddy hash-password`.
- The four services running (React/neo static builds present, Flask :5002, Neo4j :7474).
- Build the app static bundles with the proxied (same-origin) config:
  ```powershell
  # React
  cd ..\protostar-react
  $env:VITE_REACT_APP_API_BASE='/api'; $env:VITE_REACT_APP_GRAPH_BASE='/graph'
  npm run build:ignore-errors
  # neo (base + same-origin DB URL; creds still baked in for v1)
  cd ..\protostar-neo
  $env:VITE_NEO_BASE='/graph/'; $env:VITE_NEO_APP_DB_URL='/neo4j'
  $env:VITE_NEO_APP_USERNAME='neo4j'; $env:VITE_NEO_APP_PASSWORD='<pw>'
  npm run build:ignore-errors
  ```

## Build & run

```powershell
.\build-proxy.ps1        # downloads a plugin-enabled caddy.exe (Coraza + rate-limit)
.\start-proxy.ps1        # runs on :8081, WAF enforcing
```

Open `https://localhost:8443/` — the gate prompts for `protostar` / `protostar-proxy`.
Change the credential with `caddy hash-password` and update the `basic_auth` blocks
in the `Caddyfile`.

## Toggles (troubleshooting)

- **Coraza WAF:** `.\start-proxy.ps1 -CorazaMode DetectionOnly -Reload` (log-not-block)
  or `-CorazaMode Off -Reload`. Hot reload via the admin API on `localhost:2019`.
- **Gate / rate-limit:** edit the `basic_auth` / `rate_limit` blocks in the
  `Caddyfile` and `caddy reload` (env placeholders aren't honored for these).

## Verify with the smoke suite

```powershell
cd ..\smoke-tests
$env:SMOKE_BASE_URL='https://localhost:8443'
$env:SMOKE_GATE_USER='protostar'; $env:SMOKE_GATE_PASS='protostar-proxy'
npx playwright test
```

## Known findings (see design doc §5.1 / §9)

- **Gate covers the app shell only**, not `/api` or `/neo4j`. Those carry their own
  `Authorization` header (JWT Bearer / Neo4j Basic); a Basic gate on them collides
  (the app's explicit header wins, gate rejects). Gating the API routes needs a
  cookie/portal gate (Tier 2).
- **View7 (Isotopes)** previously used an unbounded `MATCH (n)-[*]->…` query the
  WAF blocked; now bounded to `[*..3]`, so it renders with the WAF enforcing.
- Runs HTTPS on `:8443`, all interfaces. TLS uses an explicit self-signed cert
  (`build-proxy.ps1` generates `tls-cert.pem`/`tls-key.pem`, auto-including SANs for
  localhost, the machine hostname, loopback, and the LAN IP, with `CA:TRUE` so it
  can be imported into a trust store). **A bare-port site with `tls internal` does
  NOT work** — Caddy has no hostname to issue a cert for, so every TLS handshake
  fails (`ERR_SSL_PROTOCOL_ERROR`); hence the pinned explicit cert. Import
  `tls-cert.pem` into clients' trust stores to drop the warning; for prod, use a
  real domain as the site address (automatic, trusted HTTPS). **Regenerating the
  cert needs a full restart of Caddy, not just `reload`.**
- HTTP/3 (QUIC) is served but browsers fall back to HTTP/2 over the self-signed cert.
