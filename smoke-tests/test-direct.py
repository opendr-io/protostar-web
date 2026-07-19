#!/usr/bin/env python3
"""Run the smoke suite in DIRECT mode (no proxy) against the Vite dev server.

Forces direct mode by clearing any leftover proxy env vars (SMOKE_BASE_URL /
SMOKE_GATE_*) for this run, so a shell that was used for proxied testing won't
accidentally point the suite at a stopped proxy. Extra Playwright args pass
through, e.g.:  python test-direct.py -g "Alerts"
"""
import os
import subprocess
import sys

here = os.path.dirname(os.path.abspath(__file__))

# Clear proxy vars for the subprocess (not the parent shell) so the config
# defaults apply: baseURL http://127.0.0.1:5173, no httpCredentials.
for var in ("SMOKE_BASE_URL", "SMOKE_GATE_USER", "SMOKE_GATE_PASS"):
  os.environ.pop(var, None)

print("Smoke: direct (http://127.0.0.1:5173, no proxy)")
npx = "npx.cmd" if os.name == "nt" else "npx"
result = subprocess.run([npx, "playwright", "test", *sys.argv[1:]], cwd=here)
sys.exit(result.returncode)
