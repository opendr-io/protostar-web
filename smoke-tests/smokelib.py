"""Shared helpers for the smoke-test runners (test-proxy.py / test-waf.py / test-direct.py)."""
import os
import re
import subprocess
import sys
from datetime import datetime

_ANSI = re.compile(r"\x1b\[[0-9;]*m")  # strip color codes from the file copy


def run_playwright(specs, passthrough, cwd, label):
    """Run Playwright for `specs`, teeing combined output to logs/<label>-<ts>.log.

    Console keeps its colors; the log file is plain text. Returns Playwright's exit
    code. `specs` and `passthrough` are lists of extra `playwright test` arguments.
    """
    logs_dir = os.path.join(cwd, "logs")
    os.makedirs(logs_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    log_path = os.path.join(logs_dir, f"{label}-{ts}.log")

    npx = "npx.cmd" if os.name == "nt" else "npx"
    cmd = [npx, "playwright", "test", *specs, *passthrough]

    print(f"Logging to {os.path.relpath(log_path, cwd)}")
    with open(log_path, "w", encoding="utf-8") as logf:
        logf.write(f"# {label}  {ts}\n")
        logf.write(f"# base={os.environ.get('SMOKE_BASE_URL', '(default)')}  "
                   f"gate_user={os.environ.get('SMOKE_GATE_USER', '(none)')}\n")
        logf.write(f"# cmd: {' '.join(cmd)}\n\n")
        logf.flush()
        proc = subprocess.Popen(cmd, cwd=cwd, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, text=True, bufsize=1)
        for line in proc.stdout:
            sys.stdout.write(line)
            logf.write(_ANSI.sub("", line))
        proc.wait()
    print(f"Log written: {os.path.relpath(log_path, cwd)}")
    return proc.returncode
