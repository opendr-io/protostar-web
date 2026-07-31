import os
import sys
import time
import threading
import subprocess
import configparser
from pathlib import Path

import preflight
from preflight import port_open

ROOT = Path(__file__).parent.absolute()

config = configparser.ConfigParser()
config.read(ROOT / "secureconfig.ini")
tls = config.get('General', 'TLS', fallback='False') != 'False'

if(os.name == 'nt'):
  venv_python = '.venv\\Scripts\\python.exe'
else:
  venv_python = '.venv/bin/python'


def stream_output(process, server_name):
  """Relay a server's output line by line with a name prefix"""
  for line in process.stdout:
    line = line.rstrip()
    if line:
      print(f"[{server_name}] {line}", flush=True)
  process.wait()
  print(f"[{server_name}] exited with code {process.returncode}", flush=True)

def wait_for_port(process, port, server_name, timeout=60):
  """Wait for a server to bind its port; fail if it exits or times out"""
  deadline = time.time() + timeout
  while time.time() < deadline:
    if process.poll() is not None:
      print(f"{server_name} exited with code {process.returncode} before binding port {port}", flush=True)
      return False
    if port_open('localhost', port):
      print(f"{server_name} is up on port {port}", flush=True)
      return True
    time.sleep(0.5)
  print(f"{server_name} did not bind port {port} within {timeout}s", flush=True)
  return False

def stop_all(processes):
  """Stop all started servers, including their child processes"""
  for process in processes:
    if process.poll() is None:
      if os.name == 'nt':
        subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], capture_output=True)
      else:
        process.terminate()

def start_server(command, directory, server_name):
  """Start a server without any setup"""
  try:
    print(f"Starting {server_name} in {directory}...")
    env = dict(os.environ, NO_COLOR='1', FORCE_COLOR='0')
    process = subprocess.Popen(command, cwd=ROOT / directory, shell=True, env=env,
      stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
      text=True, encoding='utf-8', errors='replace')
    threading.Thread(target=stream_output, args=(process, server_name), daemon=True).start()
    print(f"{server_name} started with PID {process.pid}")
    return process
  except Exception as e:
    print(f"Error starting {server_name}: {e}")
    return None

def run():
  # TLS mode runs the frontends from source (vite), otherwise from built bundles
  preflight.require(ROOT, need_keys=tls, need_node_modules=tls, need_dist=not tls)

  if tls:
    servers = [
      (venv_python + ' -m flask --app protostar-ai-dev-flask-api run --cert=keys/protostar-cert.pem --key=keys/protostar-key.pem --host 0.0.0.0 --port 5002', 'protostar-ai-dev-flask-api', 'Flask', 5002),
      ('npm run dev', 'protostar-neo', 'Neo', 3000),
      ('npm run dev', 'protostar-react', 'React', 5173)
    ]
  else:
    servers = [
      (venv_python + ' -m flask --app protostar-ai-dev-flask-api run --host 0.0.0.0 --port 5002', 'protostar-ai-dev-flask-api', 'Flask', 5002),
      ('serve -s dist -p 3000 --no-clipboard', 'protostar-neo', 'Neo', 3000),
      ('serve -s dist -p 5173 --no-clipboard', 'protostar-react', 'React', 5173)
    ]

  # Start servers one at a time; verify each is serving before starting the next
  processes = []
  for cmd, directory, name, port in servers:
    if port_open('localhost', port):
      print(f"Port {port} is already in use - is another copy of {name} running?", flush=True)
      stop_all(processes)
      sys.exit(1)
    process = start_server(cmd, directory, name)
    if process is None or not wait_for_port(process, port, name):
      print("Startup failed - stopping already-started servers", flush=True)
      stop_all(processes + ([process] if process else []))
      sys.exit(1)
    processes.append(process)

  print(f"\nAll {len(processes)} servers started and verified!", flush=True)
  print("Press Ctrl+C to stop all servers", flush=True)

  try:
    # Watch for any server dying; stop everything if one does
    while True:
      time.sleep(1)
      for (cmd, directory, name, port), process in zip(servers, processes):
        if process.poll() is not None:
          print(f"\n{name} died unexpectedly - stopping all servers", flush=True)
          stop_all(processes)
          sys.exit(1)
  except KeyboardInterrupt:
    print("\nStopping all servers...", flush=True)
    stop_all(processes)
    print("All servers stopped", flush=True)

if __name__ == '__main__':
  run()
