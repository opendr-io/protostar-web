# Design Spec: Reverse Proxy Consolidation

**Status:** Draft
**Last updated:** 2026-07-18

## 1. Summary

Front the three Protostar services — the React SPA, the Flask API, and Neo4j's
HTTP endpoint — with a single reverse proxy so the browser talks to one origin.
This removes CORS, centralizes TLS and security headers, and enables binding
Flask and Neo4j to `127.0.0.1` only. Feasible with **no protocol translation**
because protostar-neo already speaks to Neo4j over the HTTP transactional API
(`POST /tx/commit`), not Bolt — everything is plain HTTP.

## 2. Goals

- One public origin fronting React static, Flask, Neo4j HTTP, and the embedded
  protostar-neo app.
- Make requests same-origin in prod, so CORS is unused. (Keep `@cross_origin` —
  it's harmless when same-origin and is needed for direct local dev; see §7/§12.)
- Centralize TLS termination in the proxy (retire most of `inittls.py` /
  `cert.conf`).
- Single place to set CSP and security headers.
- Allow Flask + Neo4j to bind `127.0.0.1` only (closes the `0.0.0.0` + debug
  exposure).
- (Stretch) Keep Neo4j credentials out of the browser; gate `/neo4j/*` behind
  the app's JWT.

## 3. Non-Goals / Hard Constraints

- **The proxy MUST remain optional. Local dev has to start and run easily,
  exactly as today, with NO proxy required.** This is non-negotiable. The proxy
  is purely additive; the app must never *require* it to run locally.
- **Prefer off-the-shelf components; minimize code we write and maintain; do not
  build unless we have to.** Favor established modules/config (Caddy + plugins,
  Coraza + CRS, an existing auth portal) over custom sidecars/services. When a
  need can be met with configuration/rules rather than new code, do that.
- Not (yet) moving raw Cypher off the browser into Flask endpoints — that is a
  separate, larger refactor (see §9).
- Not changing application behavior — only *where* requests are routed.

## 4. Current Architecture (as-is)

- **React SPA** (`protostar-react`) — Vite dev server on `:5173`, or built +
  `serve` static. Calls Flask directly at an absolute URL composed in
  `config.tsx` (`url + ':' + port`, default `http://localhost:5002`).
- **Flask API** (`protostar-ai-dev-flask-api`) — `:5002`, bound `0.0.0.0`, CORS
  via `@cross_origin`. JWT bearer auth.
- **protostar-neo** — second Vite app on `:3000`, embedded via iframe in
  `EntityDash` (`src = ${ServerURL}:3000/view3`). Calls Neo4j **directly** from
  the browser: `POST ${VITE_NEO_APP_DB_URL}/tx/commit` with a Basic-auth header
  built from `VITE_NEO_APP_USERNAME` / `VITE_NEO_APP_PASSWORD`.
- **Neo4j** — HTTP endpoint on `:7474`. `VITE_NEO_APP_DB_URL =
  http://localhost:7474/db/neo4j`; hooks append `/tx/commit`, so the real endpoint
  is `POST /db/neo4j/tx/commit`. Basic-auth creds live in `protostar-neo/.env`
  (gitignored).
- **TLS** — handled per-service via `inittls.py` / `cert.conf` (Flask gets the
  cert directly).

Problem surface: DB credentials shipped to every browser; Neo4j reachable and
running arbitrary Cypher from the client; CORS everywhere; TLS plumbed per
service; Flask on `0.0.0.0`.

## 5. Proposed Architecture (to-be)

Single proxy (recommend **Caddy**, see §8) as the only public listener. Four
routes, all same-origin:

| Path        | Target                        | Notes                                  |
|-------------|-------------------------------|----------------------------------------|
| `/`         | React static build            | SPA fallback to `index.html`           |
| `/api/*`    | `127.0.0.1:5002` (Flask)      | strip `/api` prefix                     |
| `/graph/*`  | protostar-neo static build    | second SPA; own fallback + Vite `base`  |
| `/neo4j/*`  | `127.0.0.1:7474/db/neo4j`     | map `/neo4j`→`/db/neo4j`; allow only `POST …/tx/commit`; (later) inject Basic-auth + JWT-gate |

Browser → proxy over TLS; proxy → services over plain HTTP on loopback.

### 5.1 Perimeter Auth Gate (optional, recommended)

Put a proxy-level login in front of ALL four routes, so nothing downstream
(React, Flask, Neo4j) is reachable until a request clears the gate. This is
defense-in-depth: it collapses the entire attack surface to the gate and shields
the app's rougher edges (unvalidated-input 500s, raw-Cypher exposure) from
unauthenticated traffic entirely.

Two tiers:

- **Tier 1 — Caddy core `basic_auth`.** One directive, bcrypt-hashed
  credential(s), browser-native prompt. No app changes, no extra component. Coarse
  but effective perimeter; browser-cached per session. Was the initial choice;
  **superseded by Tier 2** (below) because Basic auth structurally can't cover
  `/api` or `/neo4j` — see the gate-collision note in §13.
- **Tier 2 — real login portal. ← DECIDED / IMPLEMENTED (`caddy-security`).** A
  form-based portal at `/auth/`, dual-mode: a **local** username/password identity
  store (proxy-level, gitignored `local-users.conf`, the always-works fallback for
  self-signed/offline) **or Google OAuth2 SSO** (per-user identity; who's allowed
  through is an email allowlist, not per-user password provisioning — lower
  friction as the team grows). Session lives in a cookie, so — unlike Tier 1 — the
  gate covers **all four routes including `/api` and `/neo4j`** without colliding
  with their own `Authorization` header. Runs in-process as one more Caddy plugin
  (compiled into `caddy.exe` by `build-proxy.py` alongside Coraza/rate-limit), no separate service.
  See §13 for the implementation notes and the one critical config gotcha.

Design notes:
- This is a SECOND, coarse auth layer, distinct from the app's JWT login (the
  gate says "you may reach the app"; the JWT says "who you are").
  - **The proxy adds exactly ONE login on top of the app's existing login.** Not
    two new logins — the app login already exists; the gate is +1. User clears the
    gate, then logs into the app as today. With Tier 1 `basic_auth` the gate
    credential is browser-cached, so it's a single prompt at the start of a
    browser session, not a prompt per request.
  - **Single sign-on** here means the *gate's* Google SSO (portal-level), NOT
    fusing the gate with the app's JWT identity. The gate and the app JWT remain
    two separate layers by design — the portal does not inject a trusted user
    header into Flask, and the app login is unchanged. Making the portal the app's
    sole identity source (proxy-injected user header / app speaking OIDC) is still
    a deferred, larger app-side change.
  - **The two-step remains** (gate login, then app login) — accepted for an
    internal tool. The gate's own login is now local-or-Google, the user's choice.
  - **Runtime-toggleable on/off** (`{env.GATE_ENABLED}`) for troubleshooting /
    proxied dev — see the toggles note in §9.2.
- It COMPLEMENTS, not replaces, the `/neo4j/*` JWT gate (§6.8) — clearing the
  perimeter must not hand someone a raw Cypher console.
- Must respect the §3 constraint: the gate is proxy-only, so local dev
  (no proxy) is unaffected.

## 6. App-Side Changes (all conditional — never hardcoded)

To honor the "proxy optional / local unchanged" constraint, every change is
env- or build-mode-driven:

1. **`config.tsx`** — base URL from env: `http://localhost:5002` locally, `/api`
   when proxied. The current `url + ':' + port` composition must be reworked to
   allow a relative base without an appended port. **Never hardcode `/api`.**
2. **protostar-neo `VITE_NEO_APP_DB_URL`** — env, `/neo4j` when proxied.
3. **protostar-neo Vite `base`** — `mode === 'production' ? '/graph/' : '/'`, so
   the neo app stays at `localhost:3000/` locally.
4. **`EntityDash` iframe `src`** — same-origin `/graph/view3` when proxied, mode-gated.
5. **(Optional convenience)** Vite `server.proxy` for a same-origin dev loop:
   `/api → :5002`, `/neo4j → :7474`, `/graph → :3000`. Optional; direct
   absolute-URL + CORS local run must keep working without it.

Config-only (v1):
6. Keep `@cross_origin` on Flask. It's needed for direct local dev (cross-origin)
   and is harmless in same-origin prod (unused headers). Dropping it would force
   local dev to be same-origin too (Vite `server.proxy` required) — rejected per
   §3. So CORS becomes *unused*, not *removed*.

**Deferred hardening (post-v1, NOT required for a working proxy).** Both touch
protostar-neo code and only apply in the proxied (same-origin) build — so per §3
("don't build unless we have to") they are explicitly out of v1. v1 relies on the
basic_auth perimeter + loopback binding + the Coraza Cypher rule instead.
7. Remove `VITE_NEO_APP_USERNAME/PASSWORD` from the neo hooks; the proxy injects
   the Neo4j `Authorization: Basic` header server-side. (neo-hook change)
8. JWT gate on `/neo4j/*` via an off-the-shelf Caddy JWT plugin (`caddy-security`
   / `caddy-jwt`) validating the app's HS512 token. Requires the **neo hooks** to
   attach the app `Bearer` token to their `/tx/commit` calls — and the neo app can
   only read that token once it's served same-origin at `/graph/` (different
   origin today = no shared `localStorage`). If adopted: keep the rotating
   per-restart secret (`secrets.token_hex(32)`) and restart the proxy with Flask —
   preferred, since no long-lived secret persists in proxy config; the opt-in
   proxied launcher generates the secret once and injects it into both.

## 7. Run Modes

- **Local dev (default, no proxy):** absolute URLs, CORS enabled, Flask/Neo4j as
  today. `startdev` / `serve` unchanged. Caddy NOT running. Security wins absent
  (acceptable for dev).
- **Local dev, same-origin (optional):** Vite `server.proxy` forwards relative
  paths; mirrors prod; no Caddy needed.
- **Proxied / deployed:** relative paths, Caddy routes all four, TLS at proxy,
  Flask/Neo4j on loopback, credential injection + JWT gate active.

## 8. Proxy Choice

**Recommend Caddy** over nginx:
- `handle_path` strips the route prefix explicitly (no `proxy_pass`
  trailing-slash roulette).
- SPA fallback is a one-liner (`try_files {path} /index.html`).
- Automatic HTTPS — retires most cert plumbing.

Cross-platform: Caddy is a single static Go binary with official Windows / macOS /
Linux builds — a real advantage since dev is Windows (nginx on Windows is
second-class / unsupported for prod). The custom build (Coraza + plugins) is built
with `xcaddy` and is also cross-platform: Coraza v3 is pure Go (no CGO, no
`libmodsecurity`), so it compiles cleanly on Windows without native-lib pain.

Nginx remains viable if ops familiarity or a specific `auth_request` pattern is
preferred. Prior attempts to get the full stack behind nginx never fully worked;
the usual culprits are documented in §10.

## 9. Security Considerations

- **The proxy alone does NOT hide Neo4j creds** unless it injects the Basic-auth
  header AND the neo hooks stop sending it (§6.7). The exposure is not transport
  (browser↔proxy is TLS, proxy↔Neo4j is loopback) — it's that the creds are baked
  into the neo JS bundle and sent by the browser, so any client that loads the app
  can read the raw Neo4j user/pass from devtools/view-source.
  - **Mitigated substantially by the gate + loopback binding**, so cred-injection
    is hardening, not critical: (1) the perimeter gate (§5.1) stops unauthenticated
    outsiders from ever loading the bundle — exposure shrinks from "anyone" to
    "gate-authorized users"; (2) Neo4j binds `127.0.0.1`, so even a leaked
    credential can't reach it directly — the only path is the JWT-gated, Coraza-
    filtered `/neo4j/*` route. A leaked cred is nearly useless.
  - **Residual:** a gate-authorized user (or a malicious extension in their
    session) can still read the DB password — matters mainly if that password is
    reused elsewhere or Neo4j is ever exposed on another interface. Cred-injection
    closes this but can be deferred.
- **`/neo4j/*` must be JWT-gated** (`auth_request` → Flask) or it becomes an open
  same-origin Cypher console.
- **Restricting to `/tx/commit` restricts the URL, not the Cypher.** An
  authenticated client can still run writes, deletes, and unbounded `[*]`
  traversals (query bombs). The real fix — moving graph queries into
  parameterized, bounded Flask endpoints — is out of scope here but should be
  named as the eventual end state.
- **Loopback binding:** with the proxy in front, Flask and Neo4j bind
  `127.0.0.1`; only the proxy is public.
- **CSP / security headers** set once, at the proxy.

### 9.1 TLS Termination

TLS terminates at the proxy; the proxy→backend hop is plain HTTP over loopback.

- **Browser ↔ proxy:** HTTPS. Proxy holds the cert (Caddy: automatic HTTPS).
- **Proxy ↔ Flask / Neo4j / static:** plain HTTP on `127.0.0.1`.
- Safe because backends bind loopback only — the plaintext hop never touches a
  network interface. (Plaintext-to-backend would only matter across hosts.)
- Retires per-service certs: Flask/Neo4j no longer need their own; only the proxy
  has a certificate. Removes most of `inittls.py` / `cert.conf`.
- Backends see plain HTTP, so anything that inspects scheme / builds absolute
  URLs / sets Secure flags must trust `X-Forwarded-Proto` (Caddy sets it). For
  Flask, `werkzeug ProxyFix`. Likely a non-issue here (JSON API, JWT headers,
  relative URLs), but note it.

### 9.2 WAF-like Rules

**Decision: Coraza + OWASP CRS** (`coraza-caddy`, an OWASP Go ModSecurity). It is
off-the-shelf and rule-driven, so it satisfies the §3 "don't build" principle —
we get SQLi/XSS/traversal/scanner coverage from CRS, and any app-specific rule is
written in SecLang config, not as a custom service. Needs an `xcaddy` build
(shared with the §5.1 portal build). Budget a CRS tuning pass (false positives /
paranoia level); for an internal, gated tool a lower paranoia level plus a few
targeted rules is likely the right dial.

**Cypher virtual-patch on `/neo4j/*` (highest value here) — as a Coraza rule.**
A SecLang rule inspects the request body and rejects writes / query bombs —
`CREATE|DELETE|DETACH|SET|MERGE|REMOVE|DROP` and unbounded `[*]` variable-length
patterns — virtually patching the arbitrary-Cypher exposure at the edge while the
real fix (bounded Flask query endpoints) is pending. Coraza can inspect the body,
so this is a rule, NOT a custom sidecar (native Caddy matchers can't regex the
body — which is why we choose Coraza rather than building one).

Also rate-limit `/api/askllm` and `/neo4j/*` (LLM cost / DB load abuse) — via the
off-the-shelf `caddy-ratelimit` module.

**Toggles for troubleshooting (required).** The three edge controls — perimeter
gate, WAF, and rate limiter — must each be runtime-toggleable, and
**independently**, so triage can rule out one without touching the others. All
driven by env vars in the Caddyfile, flipped with `caddy reload` (hot, no dropped
connections); the `protostar-proxy/` run script exposes each as a flag. (The
Caddyfile has no conditionals, so an on/off flag works via env-gated `import` of a
snippet, or env-driven directive args.)

- **Perimeter gate (`basic_auth`) — on/off (`{env.GATE_ENABLED}`, default on):**
  disable the gate to isolate an auth issue, or for a proxied local/dev run.
- **Coraza WAF — `SecRuleEngine` (three states, `{env.CORAZA_MODE}`, default `On`):**
  - `On` — enforce (block). Normal.
  - `DetectionOnly` — logs what *would* be blocked but passes traffic. Primary
    triage mode: tells you if Coraza is the cause without breaking the user.
  - `Off` — WAF fully bypassed.
  Enable Coraza's audit log so, when on, you can see which rule flagged a request.
- **Rate limiting — on/off (`{env.RATELIMIT_ENABLED}`, default on):** an env flag
  gating the `caddy-ratelimit` block (or env-driven rate/window).

Ties to §11.1: on a smoke failure through the proxy, flip the gate off / WAF to
`DetectionOnly` / rate limiting off (one at a time), rerun, and see which it was.

Framing:
- A WAF is virtual patching, not a fix — durable answers remain Flask input
  validation and moving Cypher off the browser (§9, §12). The WAF buys time.

## 10. Known nginx/proxy pitfalls (for this stack)

1. SPA fallback missing → deep links / refresh 404 (`try_files … /index.html`).
2. Two SPAs under one origin → neo app assets collide with root unless Vite
   `base = /graph/` + its own fallback. (Most likely past failure cause.)
3. `proxy_pass` prefix stripping (trailing-slash semantics).
4. Mixed content — one leftover absolute `http://host:port` blocked under HTTPS.

## 11. Incremental Rollout

**v1 — bring up one route at a time, verify, then add the next:**
1. Proxy serves React static at `/` (+ SPA fallback). App loads.
2. Add `/api/*` → Flask. Login works.
3. Add `/graph/*` → neo static (set Vite `base`, mode-gated) + same-origin iframe.
   Graph loads.
4. Add `/neo4j/*` → Neo4j `/tx/commit` (neo's existing Basic-auth passes through
   unchanged). A query returns.
5. TLS at proxy; bind Flask + Neo4j to `127.0.0.1`.
6. `basic_auth` perimeter gate over all routes.
7. Coraza — CRS at a low paranoia level + the Cypher virtual-patch rule; rate
   limits on `/api/askllm` and `/neo4j/*`.

v1 keeps `@cross_origin` and local direct-URL dev unchanged; it does NOT include
the JWT gate or cred-injection.

**Later (deferred features — see §6.8, do only after v1 is proven):**
- `/neo4j` JWT gate (neo hooks attach app `Bearer`; off-the-shelf Caddy JWT plugin).
- Neo4j credential injection (remove creds from neo hooks).
- Integrate launchers (move TLS out of `inittls.py`; add the opt-in proxied launcher).

### 11.1 Validation via the smoke suite

The Playwright smoke suite (`smoke-tests/`) is the end-to-end harness — gate each
rollout step on the matching test, run through the proxy.

- `baseURL` is already env-driven: `SMOKE_BASE_URL` (default
  `http://127.0.0.1:5173`). Point it at the proxy origin to test the proxied path;
  leave unset for today's direct run — so the suite covers BOTH modes.
- API assertions use `response.url().endsWith(...)`, so they tolerate the new
  `/api` and `/neo4j` prefixes without edits.
- Two config additions, env-gated so the direct run is unchanged:
  - `httpCredentials` (from env) so Playwright clears the `basic_auth` gate.
  - `ignoreHTTPSErrors: true` for a local self-signed proxy cert.
- Testing through the proxy needs the proxied (relative-URL) build running behind
  a running proxy. Map to §11 steps: React load → `/api` login → `/graph` render →
  `/neo4j` query.

## 12. Deployment & Repo Layout

**Decided:** stand-alone module, run on the host alongside the other services (no
container, no systemd required) — same operational model as React/Flask/Neo today.

- **New folder `protostar-proxy/`**, sibling to `protostar-react`,
  `protostar-neo`, `protostar-ai-dev-flask-api`. Contents:
  - `Caddyfile` — routes, TLS, perimeter gate, Coraza + rate-limit config.
  - `rules/` — Coraza CRS + the Cypher virtual-patch SecLang rule (§9.2).
  - build script — adds the plugins to the pre-installed Caddy via
    `caddy add-package github.com/corazawaf/coraza-caddy github.com/mholt/caddy-ratelimit`
    (Caddy fetches a plugin-enabled binary from its official download server — no
    local compile). Fallback: `xcaddy build` (Go is on the host; Coraza v3 is pure
    Go / CGO-free) only if a plugin isn't on the download server or a pinned
    version is needed.
  - OWASP CRS vendored into `rules/` (rule `.conf` files, not a package).

**Host prerequisites (out of scope for proxy setup):** Caddy is installed via the
existing host setup (Chocolatey). Chocolatey and the base Caddy install are NOT
managed by the proxy setup — it assumes `caddy` is already on PATH.
  - run script — launches the built binary on the host.
  - `README.md` — prerequisites (Go, `xcaddy`) + setup/run steps.
- **Kept OPTIONAL (per §3):** NOT wired into the default `start.py` /
  `startdev.py`. It's a separate opt-in setup+run; normal local dev runs the
  services without it. (An opt-in launcher hook can be added later.)
- **Leave `inittls.py` / `start.py` untouched until the standalone proxy is proven
  working.** Only then integrate (move TLS in, add the opt-in proxied launcher).

## 13. Implementation notes (v1 built & verified)

Built in `protostar-proxy/` and verified against the smoke suite through the proxy.

- **Result:** 12/12 smoke pass through the proxy over HTTPS with Coraza **enforcing
  (`On`)** after the View7 fix (below). Gate, WAF, and rate-limit all confirmed
  working.
- **Binary:** `build-proxy.py` compiles a standalone plugin binary (`caddy.exe`,
  gitignored) locally with `xcaddy` (via `go run`, so only Go is needed — xcaddy
  isn't installed separately), versions pinned. This is a v2 change from v1's
  prebuilt download off Caddy's build server: building locally lets the Go
  toolchain verify every module against `sum.golang.org` (dependency-tree
  provenance the bespoke download can't offer, having no published checksum);
  `add-package` was avoided because it needs admin to replace the Chocolatey
  binary on Windows. Coraza registers as `http.handlers.waf`.
- **Toggles reality:** env placeholders are NOT honored inside Coraza's `directives`
  block, and `rate_limit events` is parsed as an int at config time — so the toggles
  are driven by `start-proxy.py` (patches the `SecRuleEngine` line + `caddy reload`
  via admin API on `localhost:2019`), not by `{env.*}` in the Caddyfile. `CORAZA_MODE`
  is a live toggle; gate/rate-limit are edit-the-Caddyfile-and-reload.
- **Gate collision (RESOLVED in v2 — see below):** basic_auth could only gate the
  app shell (`/`, `/graph` static). `/api` and `/neo4j` were exempt because they
  carry their own `Authorization` header (JWT Bearer / Neo4j Basic) — a Basic gate
  on them collided (the app's explicit header wins; the gate rejects). The Tier 2
  `caddy-security` portal fixes this: its session lives in a `Cookie`, orthogonal
  to `Authorization`, so all four routes are now gated (`authorize with gatepolicy`
  on each).
- **Coraza JSON bodies:** `REQUEST_BODY` is empty for JSON unless
  `ctl:forceRequestBodyVariable=On` is set — needed for the Cypher rule to inspect
  the body.
- **View7 (FIXED):** `View7.tsx` (Isotopes) used `MATCH (n)-[*]->(a:ALERT)` — an
  unbounded traversal (query bomb) the WAF blocked. Bounded to `[*..3]`; Isotopes
  now renders with the WAF enforcing.
- **TLS + all interfaces (added):** listens on `:8443` (all interfaces, `::`).
  A bare-port site with `tls internal` **fails every handshake**
  (`ERR_SSL_PROTOCOL_ERROR`) — Caddy has no hostname to issue a cert for. Fixed
  with an explicit self-signed cert (SANs localhost/127.0.0.1/::1) via
  `tls tls-cert.pem tls-key.pem`; `build-proxy.py` generates it (SANs auto-include
  hostname + LAN IP, `CA:TRUE`). HTTPS smoke is **12/12** with the WAF enforcing.
  Also set
  `skip_install_trust` (installing the CA root needs admin and hangs on Windows).
  For prod, use a real domain as the site address for automatic HTTPS.
- **Port:** HTTP earlier on `:8081` (8080 taken by Burp); HTTPS on `:8443`.
- **App changes (all conditional/env-gated, local dev unchanged):** `config.tsx`
  (`VITE_REACT_APP_API_BASE`, new `GraphBaseURL()`), `EntityDash` + 5 dashboards
  (`View4-7`, `PrimaryDash`, `EverythingDash`) → `GraphBaseURL()`, neo `vite.config`
  `base` from `VITE_NEO_BASE`, neo `Routing.tsx` `basename` from `BASE_URL`.

### 13.1 v2 — Tier 2 gate (`caddy-security`, local + Google SSO)

Replaced the Tier 1 `basic_auth` gate with a dual-mode `caddy-security` portal,
closing the gate-collision gap above (all four routes now gated via a cookie
session).

- **Plugin:** `github.com/greenpau/caddy-security` added to the pinned `PLUGINS`
  list in `build-proxy.py` (same xcaddy build as Coraza/rate-limit). Registers the
  `security` app plus `http.handlers.authentication` (the `authenticate`/portal
  directive) and `http.handlers.authenticator` (the `authorize` directive).
- **Caddyfile:** a `security { }` app block in global options defines a `local`
  identity store, a Google `oauth` identity provider, an `authentication portal
  gateportal` (enables both, so the login page renders local form + Google button),
  and an `authorization policy gatepolicy`. The portal mounts at `handle /auth/*`
  (`handle`, not `handle_path` — the portal needs its full internal paths, e.g. the
  OAuth callback); every other route gets `authorize with gatepolicy` as its first
  directive. New `order` lines: `authenticate before respond`, `authorize before
  basic_auth`.
- **CRITICAL config gotcha:** `gatepolicy` must NOT include `validate bearer
  header`. That would opt the policy back into inspecting the `Authorization`
  header and reintroduce the exact collision this migration exists to fix. It's a
  one-line mistake that silently breaks `/api` and `/neo4j` — called out in a
  Caddyfile comment.
- **Secrets/config (all gitignored, per the `gate.conf` convention):**
  `local-users.conf` (bcrypt local account), `local-users.json` (caddy-security's
  runtime store), `google-oauth-client.conf` (Google client **ID only**),
  `google-allowlist.conf` (allowed Google emails, `import`ed into the portal),
  `security-jwt-key.conf` (session signing key). The Google client **secret is never
  written to disk** — it comes from the `PROTOSTAR_GOOGLE_CLIENT_SECRET` env var
  (`start-proxy.py` prompts for it per run if unset and holds it in-process;
  `start-proxied.py` requires it in the environment). `start-proxy.py`
  prompts/generates the rest on first run (skip if present) and exports the JWT key
  + Google client ID/secret as env vars before `caddy run`/`reload` (the signing key
  is referenced under two different directive keywords, so it can't be a single
  `import`ed line). `gate.conf.example`
  replaced by `local-users.conf.example`.
- **Google is optional:** leaving the client ID blank at the prompt skips SSO
  entirely; local auth is the always-works fallback (accepted to not work well
  under the self-signed cert / offline). Google Cloud Console setup (OAuth client,
  redirect URI per host alias, consent-screen test users) is a manual external
  step — see `protostar-proxy/README.md`.
- **Smoke suite:** the gate is now cookie/form-based, so Playwright's
  `httpCredentials` (Basic-only) no longer applies. `waf-audit-setup.ts`'s
  globalSetup logs in once through the portal's **local-auth** form and saves
  `storageState`; `playwright.config.ts` consumes it via `use.storageState`;
  `waf.spec.ts`'s `/neo4j` calls now ride that session cookie (Coraza still runs
  first, so block cases 403 before authorization). Smoke tests never drive Google's
  real login UI (impractical headless) — Google SSO is verified manually.

## 14. Open Questions

- ~~Perimeter gate tier?~~ **DECIDED & IMPLEMENTED:** Tier 2 `caddy-security`
  portal (local + Google SSO), covering all four routes — see §5.1 and §13.1.
  (Tier 1 `basic_auth` was the initial v1 choice, superseded.)
- ~~Keep vs relax the `/neo4j` JWT gate behind basic_auth?~~ **DECIDED:** no
  `/neo4j` JWT gate in v1 — it requires protostar-neo hook changes + same-origin
  token access, so it's deferred hardening (§6.8). v1 = basic_auth perimeter +
  loopback binding + Coraza Cypher rule.
- ~~Confirm Neo4j HTTP port / `VITE_NEO_APP_DB_URL` shape.~~ **CONFIRMED:** port
  `7474`, `http://localhost:7474/db/neo4j`, endpoint `POST /db/neo4j/tx/commit`.
- Caddy vs nginx — leaning **Caddy** (auto-TLS, Coraza + plugin ecosystem, less
  glue code per §3). Confirm.
- ~~JWT gate rotating-secret wrinkle?~~ **DECIDED (§6.8):** keep the rotating
  secret; proxy restarts with Flask; no long-lived secret in the proxy (preferred).
- ~~How is the proxy deployed?~~ **DECIDED (§12):** stand-alone `protostar-proxy/`
  folder, `xcaddy`-built, run on the host alongside the services, optional (not in
  `start.py`).
- ~~Local same-origin dev via Vite `server.proxy` as default?~~ **DECIDED:** default
  local dev = direct absolute URLs (unchanged, per §3); keep `@cross_origin`; Vite
  `server.proxy` is an optional same-origin mode, not the default. (Coupled: this
  is why CORS is kept, not dropped — §2/§6.6.)
- ~~Where does proxy config live / how do `inittls.py` / `start.py` change?~~
  **DECIDED:** config lives in `protostar-proxy/` (§12). Do NOT touch `inittls.py`
  / `start.py` until the proxy is proven working standalone; launcher integration
  comes only after that.
