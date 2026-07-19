"""Start the app behind the reverse proxy.

Builds the React and protostar-neo bundles with the proxied (same-origin) config,
then starts Flask (loopback-only) and the Caddy proxy on https://localhost:8443.

Assumes:
  - Neo4j (:7474) and Postgres are already running (external services).
  - protostar-proxy/build-proxy.ps1 has been run once (caddy binary + TLS cert).
  - protostar-neo/.env holds the Neo4j creds (baked into the neo bundle for v1).

For normal hot-reload dev use startdev.py instead. This is the proxied path:
static bundles served by Caddy, no Vite dev servers.

All paths are relative — the script cd's to its own directory (the repo root) so
it works regardless of where it's launched from.
"""
import os
import subprocess
import sys
import time

# cd to this script's directory (repo root) so every path below stays relative.
_here = os.path.dirname(__file__)
if _here:
  os.chdir(_here)

IS_WIN = os.name == "nt"
NPM = "npm.cmd" if IS_WIN else "npm"
VENV_PY = os.path.join("protostar-ai-dev-flask-api", ".venv", "Scripts", "python.exe") if IS_WIN \
  else os.path.join("protostar-ai-dev-flask-api", ".venv", "bin", "python")
CADDY = os.path.join("protostar-proxy", "caddy.exe" if IS_WIN else "caddy")


def build(name, env_overrides):
  print(f"Building {name} (proxied config)...")
  env = os.environ.copy()
  env.update(env_overrides)
  if subprocess.run([NPM, "run", "build:ignore-errors"], cwd=name, env=env).returncode != 0:
    sys.exit(f"  {name} build FAILED")
  print(f"  {name} built.")


def start_flask():
  # exe path is relative to the repo root (this script's cwd); child runs in the flask dir
  print("Starting Flask on 127.0.0.1:5002 ...")
  cmd = [VENV_PY, "-m", "flask", "--app", "protostar-ai-dev-flask-api", "run", "--host", "127.0.0.1", "--port", "5002"]
  return subprocess.Popen(cmd, cwd="protostar-ai-dev-flask-api")


def start_proxy():
  if not os.path.exists(CADDY):
    sys.exit("caddy binary not found — run protostar-proxy/build-proxy.ps1 first.")
  with open(os.path.join("protostar-proxy", "Caddyfile"), encoding="utf-8") as f:
    if "__GATE__" in f.read():
      sys.exit("Gate credential not set — run protostar-proxy/start-proxy.ps1 once to set it, then rerun.")
  print("Starting proxy on https://localhost:8443 (all interfaces) ...")
  return subprocess.Popen([CADDY, "run", "--config", "Caddyfile"], cwd="protostar-proxy")


def run():
  print("=== Protostar proxied startup ===\n")
  build("protostar-react", {"VITE_REACT_APP_API_BASE": "/api", "VITE_REACT_APP_GRAPH_BASE": "/graph"})
  # neo creds come from protostar-neo/.env; we only override base + DB URL
  build("protostar-neo", {"VITE_NEO_BASE": "/graph/", "VITE_NEO_APP_DB_URL": "/neo4j"})

  procs = [p for p in (start_flask(),) if p]
  time.sleep(2)
  procs += [p for p in (start_proxy(),) if p]

  print("\nProxied app: https://localhost:8443/  (gate: the credential set via start-proxy.ps1)")
  print("Press Ctrl+C to stop.\n")
  try:
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    print("\nStopping...")
    for p in procs:
      p.terminate()
    print("Stopped.")


if __name__ == "__main__":
  run()
