#!/usr/bin/env python3
"""Set up the perimeter-gate credentials and run (or reload) the protostar-proxy Caddy.

Cross-platform replacement for start-proxy.ps1 (matches build-proxy.py). On first
run it prompts for the gate's local account and, optionally, a Google OAuth client
+ email allowlist, writing gitignored config files; later runs skip whatever
already exists. Then it starts Caddy (or hot-reloads it) with the chosen Coraza mode.

Usage:
    python start-proxy.py                              # first run: prompt for gate creds, then run (WAF On)
    python start-proxy.py --coraza DetectionOnly --reload   # hot-reload, log-not-block
    python start-proxy.py --coraza Off --reload             # hot-reload, WAF bypassed

Requires the built binary — run build-proxy.py first. This starts the proxy ONLY
(assumes Flask/Neo4j and the built bundles are already up). For the full app in
proxied mode, use start-proxied.py from the repo root.
"""
import argparse
import os
import re
import secrets
import subprocess
import sys
from getpass import getpass

HERE = os.path.dirname(os.path.abspath(__file__))
IS_WIN = os.name == "nt"
CADDY = os.path.join(HERE, "caddy.exe" if IS_WIN else "caddy")
CADDYFILE = os.path.join(HERE, "Caddyfile")


def _hash_password(plain):
    out = subprocess.run([CADDY, "hash-password", "--plaintext", plain],
                         capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit("  caddy hash-password failed: " + out.stderr.strip())
    return out.stdout.strip()


def ensure_local_account():
    # local-users.conf: one bcrypt-hashed local account, imported by the local
    # identity store. `roles authp/admin` makes it the store's admin so
    # caddy-security doesn't auto-seed a default `webadmin` account (roles apply
    # only on fresh store creation — i.e. this first run).
    path = os.path.join(HERE, "local-users.conf")
    if os.path.exists(path):
        return
    print("No local perimeter-gate account set. Enter one to populate local-users.conf:")
    user = input("  Local username: ").strip()
    pw = getpass("  Local password: ")
    h = _hash_password(pw)
    m = re.match(r"^\$2[aby]\$(\d+)\$", h)  # caddy-security wants bcrypt:<cost>:<hash>
    cost = m.group(1) if m else "14"
    with open(path, "w", encoding="utf-8") as f:
        f.write(
            f"user {user} {{\n"
            f"\tname {user}\n"
            f"\temail {user}@protostar.local\n"
            f'\tpassword "bcrypt:{cost}:{h}" overwrite\n'
            f"\troles authp/admin\n"
            f"}}\n"
        )
    print(f"  Local account written to local-users.conf (user: {user}, admin).")


def ensure_jwt_key():
    # Session/JWT signing key — auto-generated, referenced by the portal + policy
    # via {env.PROTOSTAR_JWT_KEY}. Exported for the caddy child below.
    path = os.path.join(HERE, "security-jwt-key.conf")
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            f.write(secrets.token_hex(32))
        print("  Generated perimeter session signing key -> security-jwt-key.conf.")
    with open(path, encoding="utf-8") as f:
        os.environ["PROTOSTAR_JWT_KEY"] = f.read().strip()


def ensure_google_client():
    # Optional Google OAuth client (blank to skip -> local auth only). Exported as
    # env for the Caddyfile's {env.PROTOSTAR_GOOGLE_CLIENT_*} references.
    path = os.path.join(HERE, "google-oauth-client.conf")
    if not os.path.exists(path):
        print("Optional: Google SSO for the perimeter gate (blank to skip -- local auth still works).")
        print("  Requires a Google Cloud OAuth client first -- see README.")
        cid = input("  Google OAuth client ID (blank to skip): ").strip()
        csec = getpass("  Google OAuth client secret: ") if cid else ""
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"PROTOSTAR_GOOGLE_CLIENT_ID={cid}\nPROTOSTAR_GOOGLE_CLIENT_SECRET={csec}\n")
        print("  Google OAuth client written to google-oauth-client.conf.")
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()


def ensure_google_allowlist():
    # Per-deployment email allowlist for Google logins (imported into the portal).
    path = os.path.join(HERE, "google-allowlist.conf")
    if os.path.exists(path):
        return
    print("Google SSO email allowlist (who's let through after signing in with Google).")
    email = input("  Allowed Google email (blank to skip for now): ").strip()
    with open(path, "w", encoding="utf-8") as f:
        if email:
            f.write(
                "transform user {\n"
                "\tmatch realm google\n"
                f"\tmatch email {email}\n"
                "\taction add role authp/user\n"
                "}\n"
            )
        else:
            f.write(
                "# No allowed emails yet. Add a block per address and restart:\n"
                "# transform user {\n#\tmatch realm google\n#\tmatch email someone@example.com\n"
                "#\taction add role authp/user\n# }\n"
            )
    print("  Google allowlist written to google-allowlist.conf.")


def write_google_snippets():
    # Derived each run from whether a client ID is set. caddy-security rejects an
    # empty client_id, so the oauth block must be omitted entirely when Google
    # isn't configured -- otherwise the whole gate (local auth too) fails to load.
    provider = os.path.join(HERE, "google-provider.conf")
    enable = os.path.join(HERE, "google-enable.conf")
    if os.environ.get("PROTOSTAR_GOOGLE_CLIENT_ID"):
        with open(provider, "w", encoding="utf-8") as f:
            f.write(
                "oauth identity provider google {\n"
                "\trealm google\n\tdriver google\n"
                "\tclient_id {env.PROTOSTAR_GOOGLE_CLIENT_ID}\n"
                "\tclient_secret {env.PROTOSTAR_GOOGLE_CLIENT_SECRET}\n"
                "\tscopes openid email profile\n}\n"
            )
        with open(enable, "w", encoding="utf-8") as f:
            f.write("enable identity provider google\n")
        print("  Google SSO enabled (client ID set).")
    else:
        with open(provider, "w", encoding="utf-8") as f:
            f.write("# Google SSO not configured (no client ID in google-oauth-client.conf).\n")
        with open(enable, "w", encoding="utf-8") as f:
            f.write("# Google SSO not configured.\n")
        print("  Google SSO disabled (no client ID) -- local auth only.")


def apply_coraza_mode(mode):
    # Env placeholders aren't honored inside Coraza's `directives` block, so the
    # mode is applied by patching the SecRuleEngine line (same as the old ps1).
    with open(CADDYFILE, encoding="utf-8") as f:
        content = f.read()
    patched = re.sub(r"SecRuleEngine (On|DetectionOnly|Off)", f"SecRuleEngine {mode}", content)
    if patched != content:
        with open(CADDYFILE, "w", encoding="utf-8") as f:
            f.write(patched)


def main():
    parser = argparse.ArgumentParser(description="Set up + run (or reload) the protostar-proxy Caddy.")
    parser.add_argument("--coraza", choices=["On", "DetectionOnly", "Off"], default="On",
                        help="Coraza WAF mode (default On = enforcing).")
    parser.add_argument("--reload", action="store_true",
                        help="Hot-reload the running proxy via the admin API instead of starting it.")
    args = parser.parse_args()

    if not os.path.exists(CADDY):
        sys.exit("caddy binary not found. Run python build-proxy.py first.")

    ensure_local_account()
    ensure_jwt_key()
    ensure_google_client()
    ensure_google_allowlist()
    write_google_snippets()
    apply_coraza_mode(args.coraza)

    if args.reload:
        subprocess.run([CADDY, "reload", "--config", CADDYFILE, "--address", "localhost:2019"], cwd=HERE)
        print(f"Reloaded proxy (Coraza={args.coraza}).")
    else:
        print(f"Starting proxy (Coraza={args.coraza}) on https://localhost:8443 (all interfaces). Ctrl+C to stop.")
        try:
            subprocess.run([CADDY, "run", "--config", CADDYFILE], cwd=HERE)
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
