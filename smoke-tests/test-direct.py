#!/usr/bin/env python3
"""Run the smoke suite in DIRECT mode (no proxy) against the Vite dev server.

Forces direct mode by clearing any leftover proxy env vars (SMOKE_BASE_URL /
SMOKE_GATE_*) for this run, so a shell that was used for proxied testing won't
accidentally point the suite at a stopped proxy. Extra Playwright args pass
through, e.g.:  python test-direct.py -g "Alerts"
"""
import os
import sys

import smokelib

here = os.path.dirname(os.path.abspath(__file__))

# Clear proxy vars for the subprocess (not the parent shell) so the config
# defaults apply: baseURL http://127.0.0.1:5173, no perimeter-gate session.
for var in ("SMOKE_BASE_URL", "SMOKE_GATE_USER", "SMOKE_GATE_PASS"):
  os.environ.pop(var, None)

print("Smoke: direct (http://127.0.0.1:5173, no proxy)")
# App pages only; the WAF tests are proxy-only (run via test-waf.py) and self-skip here anyway.
sys.exit(smokelib.run_playwright(["tests/pages.spec.ts"], sys.argv[1:], here, "test-direct"))
