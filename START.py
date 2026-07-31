"""Pick a run mode and hand off to that launcher.

Run `python SETUP.py` once first to install the web services.

The default follows the built bundles: start-proxied.py rebuilds them with
same-origin paths, which only work behind the proxy, so a proxied build
defaults to P instead of S.
"""
import os
import subprocess
import sys
import time

import preflight

ROOT = os.path.dirname(os.path.abspath(__file__))

# key -> (menu text, script)
CHOICES = {
  'S': ('Just start in local mode', 'start-direct.py'),
  'D': ('Start in dev mode', 'start-dev.py'),
  'P': ('Start in prod mode with SSO, proxy, WAF', 'start-proxied.py'),
}
FALLBACK = 'S'
TIMEOUT = 5

def default_choice():
  """P when the bundles are proxied and the proxy is actually built, else S"""
  caddy = os.path.join(ROOT, 'protostar-proxy', 'caddy.exe' if os.name == 'nt' else 'caddy')
  if preflight.built_proxied(ROOT, 'protostar-react') and os.path.exists(caddy):
    return 'P'
  return FALLBACK

def read_choice(timeout, default):
  """One keypress within `timeout` seconds, or None if it elapses.

  Redirected stdin has no console to poll, so it falls back to a blocking read.
  """
  if not sys.stdin.isatty():
    return sys.stdin.readline()

  if os.name == 'nt':
    import msvcrt
    waiting, read = msvcrt.kbhit, msvcrt.getwche
  else:
    import select
    waiting, read = lambda: select.select([sys.stdin], [], [], 0)[0], sys.stdin.readline

  deadline = time.monotonic() + timeout
  shown = None
  while True:
    remaining = deadline - time.monotonic()
    if remaining <= 0:
      return None
    if waiting():
      return read()
    countdown = int(remaining) + 1
    if countdown != shown:
      print(f'\rChoice [{default}] (starting in {countdown}s): ', end='', flush=True)
      shown = countdown
    time.sleep(0.05)

def prompt(default):
  print('PROTOSTAR - how do you want to run?')
  for key, (text, script) in CHOICES.items():
    suffix = ' (default)' if key == default else ''
    print(f'  ({key}) {text}{suffix} - {script}')
  if default == 'P':
    print('\nBundles are built for proxy mode - S would serve them without the proxy.')
  print()
  try:
    choice = read_choice(TIMEOUT, default)
  except (EOFError, KeyboardInterrupt):
    print()
    sys.exit(0)
  print()
  if choice is None:
    return default
  # lstrip the BOM too: piped input on Windows can carry one
  return choice.strip().lstrip('﻿').upper() or default

def stop_tree(child):
  """Take the launcher and its servers down with us; they outlive us otherwise"""
  if child.poll() is not None:
    return
  if os.name == 'nt':
    subprocess.run(['taskkill', '/PID', str(child.pid), '/T', '/F'], capture_output=True)
  else:
    child.terminate()

def run():
  choice = prompt(default_choice())
  if choice not in CHOICES:
    sys.exit(f'Unknown choice: {choice}')

  text, script = CHOICES[choice]
  path = os.path.join(ROOT, script)
  if not os.path.exists(path):
    sys.exit(f'{script} not found in {ROOT}')

  print(f'{text} -> {script}\n', flush=True)
  # same interpreter, launched from the repo root so the script's relative paths hold
  child = subprocess.Popen([sys.executable, path], cwd=ROOT)
  try:
    code = child.wait()
  except KeyboardInterrupt:
    # the console signalled the child too; let it stop its own servers first
    try:
      code = child.wait(timeout=10)
    except subprocess.TimeoutExpired:
      code = 0
  finally:
    stop_tree(child)
  sys.exit(code)

if __name__ == '__main__':
  run()
