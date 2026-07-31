"""Shared setup checks for the launchers.

Underscore-free name so the hyphenated start-*.py scripts can import it.
"""
import configparser
import socket
import sys
from pathlib import Path
from urllib.parse import urlparse

FLASK_APP = 'protostar-ai-dev-flask-api'
FRONTENDS = ('protostar-neo', 'protostar-react')

# same-origin API base; only a start-proxied.py build bakes these in
PROXIED_MARKER = {'protostar-neo': '"/neo4j"', 'protostar-react': '"/api"'}

def port_open(host, port):
  """Check whether something is listening at host:port"""
  with socket.socket() as s:
    s.settimeout(2)
    return s.connect_ex((host, int(port))) == 0

def built_proxied(root, app):
  """Whether app's built bundle routes same-origin, i.e. only works behind the proxy"""
  for path in (Path(root) / app / 'dist' / 'assets').glob('*.js'):
    try:
      if PROXIED_MARKER[app] in path.read_text(encoding='utf-8', errors='ignore'):
        return True
    except OSError:
      pass
  return False

def check(root, need_node_modules=False, need_dist=False, need_keys=False):
  """Verify setup has been done and databases are reachable; return a list of problems"""
  root = Path(root)
  problems = []
  if not (root / FLASK_APP / '.venv').exists():
    problems.append(f'{FLASK_APP}/.venv missing - run SETUP.py once to set up')

  # Local config files are gitignored; each has a committed .template to copy
  local_configs = [root / FLASK_APP / 'dbconfig.ini']
  local_configs += [root / app / '.env' for app in FRONTENDS]
  for cfg in local_configs:
    if not cfg.exists():
      problems.append(f'{cfg.relative_to(root)} missing - copy {cfg.name}.template to {cfg.name} and fill in your values')
  if problems:
    return problems

  dbconfig = configparser.ConfigParser()
  dbconfig.read(root / FLASK_APP / 'dbconfig.ini')
  pghost = dbconfig.get('Database', 'HostName', fallback='localhost')
  pgport = dbconfig.get('Database', 'PortNumber', fallback='5432')
  if not port_open(pghost, pgport):
    problems.append(f'PostgreSQL not reachable at {pghost}:{pgport} - start the postgresql service first')
  bolt = urlparse(dbconfig.get('Neo4j', 'BoltURL', fallback='bolt://localhost:7687'))
  if not port_open(bolt.hostname or 'localhost', bolt.port or 7687):
    problems.append(f'Neo4j not reachable at {bolt.hostname}:{bolt.port} - start it (e.g. in Neo4j Desktop) first')

  if need_keys and not (root / FLASK_APP / 'keys').exists():
    problems.append(f'{FLASK_APP}/keys missing - run SETUP.py once to generate TLS certificates')
  for app in FRONTENDS:
    if need_node_modules and not (root / app / 'node_modules').exists():
      problems.append(f'{app}/node_modules missing - run SETUP.py once to install dependencies')
    if need_dist and not (root / app / 'dist').exists():
      problems.append(f'{app}/dist missing - run SETUP.py once to build')
  # one message, not one per app: the fix is a single command either way
  if need_dist and any(built_proxied(root, app) for app in FRONTENDS):
    problems.append('dist bundles are built for proxy mode - run SETUP.py to rebuild them for direct')
  return problems

def require(root, **needs):
  """Exit with the problem list if setup is incomplete"""
  problems = check(root, **needs)
  if problems:
    print('Setup incomplete:')
    for problem in problems:
      print(f'  - {problem}')
    sys.exit(1)
