# protostar-proxy

Optional reverse proxy (Caddy + Coraza WAF + rate-limit) that fronts all four
Protostar services behind one origin. See `docs/reverse-proxy-design.md` for the
full design. The proxy is **optional** — local dev runs exactly as before without
it (the app config falls back to direct absolute URLs).

```
client ── HTTPS ──► :8443 Caddy
                     │  Coraza WAF (OWASP CRS 4.28.0 + Neo4j hard-blocks)
                     │  rate_limit (per client IP)
                     │  caddy-security gate (portal at /auth/: local login OR Google SSO)
                     │
                     ├─ /auth/*  ── login portal ───────► caddy-security
                     ├─ /api/*   ─ [gate] [allowlist] ──► Flask        127.0.0.1:5002
                     ├─ /neo4j/* ─ [gate] rewrite /db… ─► Neo4j HTTP   127.0.0.1:7474
                     ├─ /graph/* ─ [gate] ─────────────► protostar-neo/dist   (static)
                     └─ /*       ─ [gate] ─────────────► protostar-react/dist (static)
```

The gate is a **cookie-based session** (caddy-security), so it covers *all* routes
— including `/api` and `/neo4j`, which set their own `Authorization` header (JWT
Bearer / Neo4j Basic). The session lives in a `Cookie`, not the `Authorization`
header, so there's no collision (the old `basic_auth` gate couldn't cover those
two for exactly that reason). Backends bind loopback; only the proxy is reachable
from the network.

```
python protostar-proxy/start-proxy.py --coraza Off --reload            # WAF off
python protostar-proxy/start-proxy.py --coraza DetectionOnly --reload  # log, don't block
python protostar-proxy/start-proxy.py --coraza On --reload             # enforcing
```

## What it does

One origin (`https://<host>:8443`, listens on all interfaces), the login portal
plus four proxied routes:

| Path       | Target                        |
|------------|-------------------------------|
| `/auth/*`  | caddy-security login portal   |
| `/`        | React static build            |
| `/api/*`   | Flask on `127.0.0.1:5002`     |
| `/graph/*` | protostar-neo static build    |
| `/neo4j/*` | Neo4j HTTP `127.0.0.1:7474/db/neo4j` (`POST …/tx/commit`) |

Plus: a caddy-security perimeter gate covering *every* route (cookie session), a
Coraza WAF (blocks Cypher writes/DDL and unbounded `[*]` traversals on `/neo4j`),
and rate limiting.

### Perimeter gate (caddy-security)

The gate serves a login page at `/auth/` offering two options, the user's choice:

- **Local account** — a username/password stored (bcrypt-hashed) in the gitignored
  `local-users.conf`. `start-proxy.py` prompts for it on first run. This is the
  fallback that always works, including under the self-signed cert / offline.
- **Google SSO** — "Sign in with Google" via a Google Cloud OAuth2 client. Optional;
  configured only if you supply a client ID/secret (see below). Which Google
  accounts are allowed through is an email allowlist (`google-allowlist.conf`), not
  a per-user password — lower friction as the team grows.

The gate is deliberately a *separate* identity layer from the app's own login (the
Postgres `appusers` + JWT): the gate says "you may reach the app"; the JWT says
"who you are." Sessions last 24h (`crypto default token lifetime` in the Caddyfile).

**Setting up Google SSO** (optional — skip and local auth still works):

1. Google Cloud Console → create/select a project → configure the OAuth consent
   screen (External; "Testing" publishing status is fine for internal use).
2. Credentials → **Create OAuth client ID** → Application type: **Web application**.
3. Add an **Authorized redirect URI** for each host alias you actually reach the
   proxy by, e.g.
   `https://localhost:8443/auth/oauth2/google/authorization-code-callback`
   (plus the machine-hostname / LAN-IP variants if used). Google requires an exact
   match per alias.
4. The **Client ID** goes in `google-oauth-client.conf` (`start-proxy.py` prompts for
   it on first run; leave blank to skip Google SSO). The **Client Secret is never
   stored on disk** — provide it via the `PROTOSTAR_GOOGLE_CLIENT_SECRET` environment
   variable (export it, or use a secrets manager). `start-proxy.py` prompts for it
   per run if it's not set; `start-proxied.py` requires it in the environment and
   refuses to start Google SSO without it.
5. While the consent screen is in "Testing" status, add each allowed person as a
   Google **test user** *and* add their email to `google-allowlist.conf`. The two
   are separate gates: the test-user list controls who can complete Google's own
   login screen; the allowlist controls who caddy-security lets through afterward.

`/api` is an allowlist of known Flask endpoints — anything unlisted 403s at the
proxy. `/renew` and `/register` are deliberately not exposed (unused by the app;
`/renew` would let a stolen refresh token mint access tokens). New Flask endpoints
must be added to the `@app` matcher in the `Caddyfile`.

## Prerequisites

- **Go toolchain** (https://go.dev/dl/) — `build-proxy.py` uses it to compile Caddy
  via `xcaddy`. (The built `caddy` binary also provides `hash-password`, which
  `start-proxy.py` uses — no separate Caddy install needed.)
- **Python 3** — runs `build-proxy.py`, `start-proxy.py`, and `start-proxied.py`.
- **Neo4j** (`:7474`) and **Postgres** running — external services the app needs
  (Postgres backs the app's own `/api/login`, separate from the gate).
- **`protostar-ai-dev-flask-api/agentconfig.ini`** present (copy from
  `agentconfig.ini.template`) — Flask won't start without it. An empty `AnthropicKey`
  is fine; only the LLM features need a real key.

`start-proxied.py` (below) builds the React/neo bundles for you with the proxied
(same-origin) config, so you don't normally build them by hand. To build manually:

```powershell
cd ..\protostar-react
$env:VITE_REACT_APP_API_BASE='/api'; $env:VITE_REACT_APP_GRAPH_BASE='/graph'
npm run build:ignore-errors
cd ..\protostar-neo   # base + same-origin DB URL; Neo4j creds still baked in for v1
$env:VITE_NEO_BASE='/graph/'; $env:VITE_NEO_APP_DB_URL='/neo4j'
$env:VITE_NEO_APP_USERNAME='neo4j'; $env:VITE_NEO_APP_PASSWORD='<pw>'
npm run build:ignore-errors
```

## Setup (once)

```powershell
python protostar-proxy/build-proxy.py    # xcaddy-builds the caddy binary + OWASP CRS rules + TLS cert
python protostar-proxy/start-proxy.py    # first run: prompts for the gate credential, then starts the proxy
```

`build-proxy.py` compiles Caddy locally with `xcaddy` (via `go run`, so only the
Go toolchain is required — xcaddy isn't installed separately). Building rather than
downloading a prebuilt binary means the Go toolchain verifies every module against
`sum.golang.org`, giving provenance over the whole dependency tree. Versions are
pinned at the top of the script.

On its **first run**, `start-proxy.py` prompts for:
- a **local gate account** (username / password) — written bcrypt-hashed to
  `local-users.conf`, and made the store admin so no default `webadmin` is seeded;
- optionally a **Google OAuth client** (client ID / secret) and one **allowed
  email** — leave blank to skip Google SSO (local login still works).

It auto-generates the session signing key and derives the Google config snippets.
All of these are gitignored; subsequent runs skip whatever already exists. Since
`start-proxy.py` also *starts* the proxy (blocking), press `Ctrl+C` after the
credential is written if you're going to use `start-proxied.py` next.

## Running in proxy mode

Two launchers, depending on what's already up:

- **`python start-proxied.py`** (repo root) — the **all-in-one**: builds the
  React/neo bundles with the proxied config, starts Flask on loopback, and launches
  the proxy. Use this to bring up the whole app. Requires the gate already set up
  (run `start-proxy.py` once first) and Neo4j + Postgres running.
- **`python protostar-proxy/start-proxy.py`** — the **proxy only** (plus the
  first-run gate prompts). Use it when Flask, Neo4j, and the built bundles are
  already running and you just want the proxy — e.g. iterating on gate/WAF config.

## First login

Open **`https://localhost:8443/`**:

1. **Self-signed cert warning** — click through (Firefox: *Advanced → Accept the
   Risk and Continue*), or import `protostar-proxy/tls-cert.pem` into your trust
   store to silence it.
2. You're redirected to **`/auth/`** — the login portal. Sign in with your **local
   account** (or **Sign in with Google** if configured).
3. After login you land on the caddy-security **portal**. Click the **Protostar**
   tile to launch the app, or just go to `https://localhost:8443/` (you're
   authenticated now, so it loads directly).
4. Inside the app, log in with the **app account** (`appuser` / `appuser`, from the
   Postgres `appusers` table). This is a *separate* layer from the gate — the gate
   says "you may reach the app"; the app JWT says "who you are."

## Toggles (troubleshooting)

- **Coraza WAF mode:** `python start-proxy.py --coraza DetectionOnly --reload`
  (log-not-block) or `--coraza Off --reload`. The mode toggle hot-reloads via the
  admin API on `localhost:2019` — no restart needed.
- **WAF rules** (`waf-exceptions.conf`, custom rules): a `--reload` does **not**
  re-provision rule add/removes — **restart** the proxy (stop and rerun
  `start-proxy.py`) after editing them.
- **Gate:** edit the gitignored `local-users.conf` (local accounts) or
  `google-allowlist.conf` (allowed Google emails), then restart the proxy. To rotate
  the local password, regenerate the hash with `caddy hash-password`, or delete
  `local-users.conf` and rerun `start-proxy.py` to be prompted again.
- **Rate-limit:** edit the `rate_limit` block in the `Caddyfile` and `caddy reload`.

## Verify with the smoke suite

Two runners, split so the routine app smoke stays clean:

```powershell
cd ..\smoke-tests
# App pages (routine smoke) — pass the local gate account as args:
python test-proxy.py --user <user> --password <pass>
# extra Playwright args pass through, e.g.  python test-proxy.py -u <user> -p <pass> -g "Alerts"
# (SMOKE_GATE_USER / SMOKE_GATE_PASS env vars also work if you prefer)

# WAF Cypher hard-blocks — stand-alone, run on demand:
python test-waf.py --user <user> --password <pass>
```

Both log in once through the portal's **local-auth** form (globalSetup) and reuse
the session cookie for every test; neither drives the Google flow (needs a real
Google account + consent screen — Google SSO is verified manually).

`test-waf.py` is kept **separate** on purpose: it sends deliberate attack payloads
(which pile up as blocked entries in the WAF audit log) and **requires the WAF
enforcing** (`--coraza On`) — under DetectionOnly/Off the "blocks …" cases correctly
fail. Keeping it out of `test-proxy.py` avoids mistaking either for a real problem.
It warns up front if Coraza isn't in `On` mode. It covers three groups: WAF Cypher
hard-blocks, perimeter-gate coverage (unauthenticated requests bounce to `/auth`),
and **backend isolation**.

The backend-isolation checks (Flask `:5002`, Neo4j HTTP `:7474`, Bolt `:7687` must
be unreachable directly) only run when the target is **remote** — against localhost
the backends are reachable by design (loopback), so they skip. Run from a different
machine to exercise them:

```powershell
$env:SMOKE_BASE_URL='https://<server-ip>:8443'
python test-waf.py --user <user> --password <pass>
```

## Known findings (see design doc §5.1 / §9)

- **Gate now covers all routes**, including `/api` and `/neo4j`, via a cookie-based
  caddy-security session — the cookie doesn't collide with those routes' own
  `Authorization` header (JWT Bearer / Neo4j Basic), which is why the old
  `basic_auth` gate couldn't cover them. This is the Tier 2 portal from design §5.1.
- **View7 (Isotopes)** previously used an unbounded `MATCH (n)-[*]->…` query the
  WAF blocked; now bounded to `[*..3]`, so it renders with the WAF enforcing.
- Runs HTTPS on `:8443`, all interfaces. TLS uses an explicit self-signed cert
  (`build-proxy.py` generates `tls-cert.pem`/`tls-key.pem`, auto-including SANs for
  localhost, the machine hostname, loopback, and the LAN IP, with `CA:TRUE` so it
  can be imported into a trust store). **A bare-port site with `tls internal` does
  NOT work** — Caddy has no hostname to issue a cert for, so every TLS handshake
  fails (`ERR_SSL_PROTOCOL_ERROR`); hence the pinned explicit cert. Import
  `tls-cert.pem` into clients' trust stores to drop the warning; for prod, use a
  real domain as the site address (automatic, trusted HTTPS). **Regenerating the
  cert needs a full restart of Caddy, not just `reload`.**
- HTTP/3 (QUIC) is served but browsers fall back to HTTP/2 over the self-signed cert.
