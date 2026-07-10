import os
import sys
import time
import socket
import threading
import subprocess
import configparser
import concurrent.futures
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent.absolute()

config = configparser.ConfigParser()
config.read(ROOT / "secureconfig.ini")
tls = config.get('General', 'TLS', fallback='False') != 'False'

if(os.name == 'nt'):
  venv_python = '.venv\\Scripts\\python.exe'
else:
  venv_python = '.venv/bin/python'

def port_open(host, port):
  """Check whether something is listening at host:port"""
  with socket.socket() as s:
    s.settimeout(2)
    return s.connect_ex((host, int(port))) == 0

def preflight():
  """Verify setup has been done and databases are reachable; return a list of problems"""
  problems = []
  if not (ROOT / 'skynet-ai-dev-flask-api' / '.venv').exists():
    problems.append('skynet-ai-dev-flask-api/.venv missing - run startup.py once to set up')

  dbconfig = configparser.ConfigParser()
  dbconfig.read(ROOT / 'skynet-ai-dev-flask-api' / 'dbconfig.ini')
  pghost = dbconfig.get('Database', 'HostName', fallback='localhost')
  pgport = dbconfig.get('Database', 'PortNumber', fallback='5432')
  if not port_open(pghost, pgport):
    problems.append(f'PostgreSQL not reachable at {pghost}:{pgport} - start the postgresql service first')
  bolt = urlparse(dbconfig.get('Neo4j', 'BoltURL', fallback='bolt://localhost:7687'))
  if not port_open(bolt.hostname or 'localhost', bolt.port or 7687):
    problems.append(f'Neo4j not reachable at {bolt.hostname}:{bolt.port} - start it (e.g. in Neo4j Desktop) first')
  if tls:
    if not (ROOT / 'skynet-ai-dev-flask-api' / 'keys').exists():
      problems.append('skynet-ai-dev-flask-api/keys missing - run startup.py once to generate TLS certificates')
    for app in ('skynet-neo', 'skynet-react'):
      if not (ROOT / app / 'node_modules').exists():
        problems.append(f'{app}/node_modules missing - run startup.py once to install dependencies')
  else:
    for app in ('skynet-neo', 'skynet-react'):
      if not (ROOT / app / 'dist').exists():
        problems.append(f'{app}/dist missing - run startup.py once to build')
  return problems

def stream_output(process, server_name):
  """Relay a server's output line by line with a name prefix"""
  for line in process.stdout:
    line = line.rstrip()
    if line:
      print(f"[{server_name}] {line}")
  process.wait()
  print(f"[{server_name}] exited with code {process.returncode}")

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
  problems = preflight()
  if problems:
    print("Setup incomplete:")
    for problem in problems:
      print(f"  - {problem}")
    sys.exit(1)

  if tls:
    servers = [
      (venv_python + ' -m flask --app skynet-ai-dev-flask-api run --cert=keys/protostar-cert.pem --key=keys/protostar-key.pem --host 0.0.0.0 --port 5002', 'skynet-ai-dev-flask-api', 'Flask'),
      ('npm run dev', 'skynet-neo', 'Neo'),
      ('npm run dev', 'skynet-react', 'React')
    ]
  else:
    servers = [
      (venv_python + ' -m flask --app skynet-ai-dev-flask-api run --host 0.0.0.0 --port 5002', 'skynet-ai-dev-flask-api', 'Flask'),
      ('serve -s dist -p 3000 --no-clipboard', 'skynet-neo', 'Neo'),
      ('serve -s dist -p 5173 --no-clipboard', 'skynet-react', 'React')
    ]

  processes = []

  with concurrent.futures.ThreadPoolExecutor(max_workers=len(servers)) as executor:
    futures = [
      executor.submit(start_server, cmd, directory, name)
      for cmd, directory, name in servers
    ]
    for future in concurrent.futures.as_completed(futures):
      process = future.result()
      if process:
        processes.append(process)

  print(f"\nAll servers started! Running {len(processes)} processes.")
  print("Press Ctrl+C to stop all servers")

  try:
    # Keep the main thread alive
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    print("\nStopping all servers...")
    for process in processes:
      process.terminate()
    print("All servers stopped")

if __name__ == '__main__':
  run()
