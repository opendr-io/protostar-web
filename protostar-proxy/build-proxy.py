"""Build the plugin-enabled Caddy binary for protostar-proxy via xcaddy.

Unlike a prebuilt download, xcaddy compiles Caddy locally with the Go toolchain,
which verifies every module (Caddy core + each plugin, at the pinned versions
below) against Go's checksum database (sum.golang.org). That gives cryptographic
provenance over the whole dependency tree — the reason we build rather than pull a
bespoke binary off Caddy's download server (which has no published checksum).

Requires the Go toolchain (https://go.dev/dl/). xcaddy itself does NOT need to be
installed separately: it's fetched and version-pinned via `go run`.

Also fetches the OWASP Core Rule Set (the WAF rules the Caddyfile Includes) and
generates a self-signed TLS cert. Cross-platform (Windows/macOS/Linux); replaces
the old build-proxy.ps1.
"""
import os
import shutil
import socket
import subprocess
import sys
import urllib.request
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
IS_WIN = os.name == "nt"

# --- pinned versions (bump deliberately; every change is checksum-verified) ---
CADDY_VERSION = "v2.11.4"
XCADDY_VERSION = "v0.4.6"
PLUGINS = [
    "github.com/corazawaf/coraza-caddy/v2@v2.5.0",
    "github.com/mholt/caddy-ratelimit@v0.1.0",
    "github.com/greenpau/caddy-security@v1.1.64",
]
CRS_VERSION = "4.28.0"

CADDY_BIN = os.path.join(HERE, "caddy.exe" if IS_WIN else "caddy")


def build_caddy():
    if not shutil.which("go"):
        sys.exit("Go toolchain not found. Install Go (https://go.dev/dl/) and retry.")
    print(f"Building Caddy {CADDY_VERSION} via xcaddy {XCADDY_VERSION} "
          "(Go verifies every module against sum.golang.org)...")
    cmd = [
        "go", "run", f"github.com/caddyserver/xcaddy/cmd/xcaddy@{XCADDY_VERSION}",
        "build", CADDY_VERSION, "--output", CADDY_BIN,
    ]
    for p in PLUGINS:
        cmd += ["--with", p]
    env = os.environ.copy()
    env["CGO_ENABLED"] = "0"  # pure-Go build; no C compiler needed (Coraza v2 is pure Go)
    if subprocess.run(cmd, cwd=HERE, env=env).returncode != 0:
        sys.exit("  xcaddy build FAILED")

    # Sanity: confirm the expected handler/app modules registered in the binary.
    out = subprocess.run([CADDY_BIN, "list-modules"], cwd=HERE,
                         capture_output=True, text=True).stdout
    lines = {ln.strip() for ln in out.splitlines()}
    wanted = [
        "http.handlers.waf",            # coraza
        "http.handlers.rate_limit",     # ratelimit
        "http.handlers.authentication", # caddy-security portal (`authenticate`)
        "http.handlers.authenticator",  # caddy-security gate (`authorize`)
        "security",                     # caddy-security app
    ]
    missing = [m for m in wanted if m not in lines]
    print("  Modules present:", ", ".join(m for m in wanted if m in lines))
    if missing:
        sys.exit(f"  Expected modules missing from build: {', '.join(missing)}")


def fetch_crs():
    # OWASP CRS — the WAF rules the Caddyfile Includes. Downloaded and gitignored
    # (not vendored), pinned. The "minimal" release zip omits every *.data file
    # (used by e.g. the scanner-detection rules) and Coraza fails to provision
    # without them; the release assets publish no full archive, so pull the
    # complete source via GitHub's tag archive.
    crs_dir = os.path.join(HERE, f"coreruleset-{CRS_VERSION}")
    if os.path.exists(os.path.join(crs_dir, "crs-setup.conf")):
        print(f"OWASP CRS {CRS_VERSION} already present.")
        return
    print(f"Downloading OWASP CRS {CRS_VERSION} (full source, for the *.data files)...")
    url = f"https://github.com/coreruleset/coreruleset/archive/refs/tags/v{CRS_VERSION}.zip"
    zip_path = os.path.join(HERE, f"crs-{CRS_VERSION}.zip")
    urllib.request.urlretrieve(url, zip_path)
    if os.path.exists(crs_dir):
        shutil.rmtree(crs_dir)  # clear a stale/incomplete prior fetch
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(HERE)  # zip's top dir is coreruleset-<version>
    os.remove(zip_path)
    # crs-setup.conf ships as .example; the Caddyfile Includes crs-setup.conf
    shutil.copyfile(os.path.join(crs_dir, "crs-setup.conf.example"),
                    os.path.join(crs_dir, "crs-setup.conf"))
    print(f"  CRS installed -> {crs_dir}")


def _lan_ip():
    # Pick the primary outbound IPv4 without sending packets (UDP connect just
    # selects the routing interface). Returns None if only loopback is available.
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        finally:
            s.close()
        return ip if not ip.startswith("127.") else None
    except OSError:
        return None


def make_cert():
    # Self-signed TLS cert. A bare-port site with `tls internal` can't present a
    # cert for the client's SNI, so we pin an explicit cert with SANs for
    # localhost, the machine hostname, loopback, and the primary LAN IP so it
    # works for network access. CA:TRUE makes it importable into a trust store.
    cert = os.path.join(HERE, "tls-cert.pem")
    key = os.path.join(HERE, "tls-key.pem")
    if os.path.exists(cert):
        print("TLS cert already present.")
        return
    if not shutil.which("openssl"):
        sys.exit("openssl not found — needed to generate the self-signed TLS cert.")
    hn = socket.gethostname()
    sans = ["DNS:localhost", f"DNS:{hn}", "IP:127.0.0.1", "IP:0:0:0:0:0:0:0:1"]
    ip = _lan_ip()
    if ip:
        sans.append(f"IP:{ip}")
    san = ",".join(sans)
    print(f"Generating self-signed TLS cert (CN={hn}, SANs: {san})...")
    env = os.environ.copy()
    if IS_WIN:
        env["MSYS_NO_PATHCONV"] = "1"  # keep mingw openssl from mangling /CN= and IP: args
    cmd = [
        "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
        "-keyout", key, "-out", cert, "-days", "825",
        "-subj", f"/CN={hn}",
        "-addext", "basicConstraints=critical,CA:TRUE",
        "-addext", f"subjectAltName={san}",
    ]
    if subprocess.run(cmd, cwd=HERE, env=env).returncode != 0:
        sys.exit("  openssl cert generation FAILED")


def main():
    print("=== protostar-proxy build (xcaddy) ===")
    build_caddy()
    fetch_crs()
    make_cert()
    print(f"Done -> {CADDY_BIN} (+ tls-cert.pem/tls-key.pem)")


if __name__ == "__main__":
    main()
