#!/usr/bin/env python3
"""Run the smoke suite through the reverse proxy (HTTPS + perimeter gate).

Requires the proxy running (protostar-proxy/start-proxy.ps1) and the built app
bundles present. Extra Playwright args pass through, e.g.:
    python test-proxy.py -g "Alerts"
    python test-proxy.py --headed

Env vars are honored if already set, else default to the proxy on :8443.
"""
import os
import subprocess
import sys

here = os.path.dirname(os.path.abspath(__file__))

os.environ.setdefault("SMOKE_BASE_URL", "https://localhost:8443")
os.environ.setdefault("SMOKE_GATE_USER", "tesla")
os.environ.setdefault("SMOKE_GATE_PASS", "thewayitis2026")

print(f"Smoke: {os.environ['SMOKE_BASE_URL']} (gate user: {os.environ['SMOKE_GATE_USER']})")

npx = "npx.cmd" if os.name == "nt" else "npx"
result = subprocess.run([npx, "playwright", "test", *sys.argv[1:]], cwd=here)
sys.exit(result.returncode)
