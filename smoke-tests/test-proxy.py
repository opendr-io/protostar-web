#!/usr/bin/env python3
"""Run the app smoke suite through the reverse proxy (HTTPS + perimeter gate).

Runs the app-page tests (tests/pages.spec.ts) only. The WAF hard-block tests live
in a separate runner — `python test-waf.py` — because they send attack payloads and
require the WAF enforcing; keeping them apart avoids false alarms in the app smoke.

Requires the proxy running (protostar-proxy/start-proxy.py) and the built app
bundles present.

Provide the perimeter-gate credential (the local account from start-proxy.py)
as args or env vars — args win:
    python test-proxy.py --user admin --password protostar
    python test-proxy.py -u admin -p protostar
    $env:SMOKE_GATE_USER='admin'; $env:SMOKE_GATE_PASS='protostar'; python test-proxy.py

Any other args pass through to Playwright, e.g.:
    python test-proxy.py -u admin -p protostar -g "Alerts"
    python test-proxy.py -u admin -p protostar --headed

SMOKE_BASE_URL is honored if set, else defaults to the proxy on :8443.
"""
import argparse
import os
import sys

import smokelib

here = os.path.dirname(os.path.abspath(__file__))

# allow_abbrev=False so we don't swallow prefixes of Playwright's own flags;
# unknown args (Playwright's) pass through untouched.
parser = argparse.ArgumentParser(add_help=False, allow_abbrev=False)
parser.add_argument("--user", "-u", help="perimeter-gate username")
parser.add_argument("--password", "-p", help="perimeter-gate password")
args, passthrough = parser.parse_known_args()

os.environ.setdefault("SMOKE_BASE_URL", "https://localhost:8443")
if args.user:
    os.environ["SMOKE_GATE_USER"] = args.user
if args.password:
    os.environ["SMOKE_GATE_PASS"] = args.password

# Perimeter-gate login (caddy-security local-auth account from local-users.conf).
# No default credential is baked in — globalSetup uses these to log in through the
# portal form and capture the session cookie for the run.
if not os.environ.get("SMOKE_GATE_USER") or not os.environ.get("SMOKE_GATE_PASS"):
    sys.exit(
        "Provide the perimeter-gate account (the local account set via "
        "protostar-proxy/start-proxy.py):\n"
        "  python test-proxy.py --user <user> --password <pass>\n"
        "or set SMOKE_GATE_USER / SMOKE_GATE_PASS in the environment."
    )

print(f"Smoke: {os.environ['SMOKE_BASE_URL']} (gate user: {os.environ['SMOKE_GATE_USER']})")

sys.exit(smokelib.run_playwright(["tests/pages.spec.ts"], passthrough, here, "test-proxy"))
