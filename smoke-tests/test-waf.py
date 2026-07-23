#!/usr/bin/env python3
"""Run the WAF Cypher hard-block tests through the reverse proxy — stand-alone.

Kept separate from the routine app smoke (test-proxy.py) on purpose. These tests
send deliberate ATTACK payloads (CREATE/SET/DROP/GRANT/CALL apoc/…) to verify
Coraza's /neo4j hard-blocks, which means they:
  - accumulate WAF audit-log entries (all blocked, all intentional), and
  - REQUIRE the WAF in enforcing mode — under DetectionOnly/Off the payloads pass
    and the "blocks …" assertions (correctly) fail.
Running them on demand, apart from the app smoke, avoids mistaking either for a
real problem.

Gate credential as args or env (same as test-proxy.py):
    python test-waf.py --user admin --password protostar
    python test-waf.py -u admin -p protostar        # + any Playwright args pass through
"""
import argparse
import os
import re
import sys

import smokelib

here = os.path.dirname(os.path.abspath(__file__))

parser = argparse.ArgumentParser(add_help=False, allow_abbrev=False)
parser.add_argument("--user", "-u", help="perimeter-gate username")
parser.add_argument("--password", "-p", help="perimeter-gate password")
args, passthrough = parser.parse_known_args()

os.environ.setdefault("SMOKE_BASE_URL", "https://localhost:8443")
if args.user:
    os.environ["SMOKE_GATE_USER"] = args.user
if args.password:
    os.environ["SMOKE_GATE_PASS"] = args.password

if not os.environ.get("SMOKE_GATE_USER") or not os.environ.get("SMOKE_GATE_PASS"):
    sys.exit(
        "Provide the perimeter-gate account (set via protostar-proxy/start-proxy.py):\n"
        "  python test-waf.py --user <user> --password <pass>\n"
        "or set SMOKE_GATE_USER / SMOKE_GATE_PASS in the environment."
    )

# Warn early if the WAF isn't enforcing — the block assertions will fail otherwise.
caddyfile = os.path.join(here, "..", "protostar-proxy", "Caddyfile")
try:
    with open(caddyfile, encoding="utf-8") as fh:
        m = re.search(r"SecRuleEngine (On|DetectionOnly|Off)", fh.read())
    if m and m.group(1) != "On":
        print(f"WARNING: Coraza is '{m.group(1)}', not 'On' — the block tests will fail. Enforce with:")
        print("  python protostar-proxy/start-proxy.py --coraza On --reload")
except OSError:
    pass

print(f"WAF smoke: {os.environ['SMOKE_BASE_URL']} (gate user: {os.environ['SMOKE_GATE_USER']})")

sys.exit(smokelib.run_playwright(["tests/waf.spec.ts"], passthrough, here, "test-waf"))
