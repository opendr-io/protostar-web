---
name: verify
description: Build, launch, and drive protostar-web (React + Flask + Postgres + Neo4j) to verify changes end-to-end.
---

# Verifying protostar-web

Two apps: `protostar-react` (Vite/React, dev port 5173) and `protostar-ai-dev-flask-api` (Flask, port 5002). Needs local Postgres + Neo4j running; connection settings in `protostar-ai-dev-flask-api/dbconfig.ini` (gitignored; template alongside).

## Backend

- No committed venv. Python 3.14 works: `python -m venv <dir> && pip install -r protostar-ai-dev-flask-api/requirements.txt` (the `protostar` venv on Desktop is a different project — no flask/psycopg).
- DB bootstrap: `python dbcreation.py` from the flask-api dir (idempotent; creates db, tables, `appuser` + `agent` users).
- Run: `python protostar-ai-dev-flask-api.py` from its own dir (uses `sys.path.append('services')` — cwd matters). Listens on 5002.
- Login: POST `/login` with ApplicationUser/ApplicationUserPassword from dbconfig.ini → `access_token`; all other routes need `Authorization: Bearer <token>` and are POST.
- Empty/malformed login body → 500 (pre-existing; `data.get('password').encode` on None).
- LLM agent comments need `AnthropicKey` in `agentconfig.ini`; without it `ask_claude` returns `''` and no agent comment is posted.

## Frontend

- `npm run build` fails: `tsc -b` has ~100+ pre-existing errors on main. Use `npx vite build` or `npm run build:ignore-errors` for bundle verification.
- Dev server: `npx vite --port 5173` in `protostar-react/`. API URL defaults to `http://localhost:5002`.
- Drive with Playwright (pip `playwright`, `channel='msedge'`, headless) — no browser download needed.
- Login page: `#username`, `#password`, `button[type=submit]`; successful login lands on `/summary`.
- Nav bar links: `a[href="/cases"]` etc. On Tactical (`/summary`), entity cells are `div[title="<ENTITY>"]`; clicking navigates to `/details` (seeds redux).
- Cases wizard fields: `#txtCaseName`, `#lstEntities` (select), `#txtPriority`, `#txtDescription`.
- Pre-existing console noise: React "unique key prop" warnings on most pages — not a regression signal.
