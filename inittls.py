import subprocess
import concurrent.futures
import os
import time
import configparser
from pathlib import Path

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "secureconfig.ini")

def setup_and_start_server(command, directory, server_name):
  """Setup environment and start server"""
  try:
    print(f"Starting {server_name} in {directory}...")
    
    # Adjust command for Flask virtual environment
    if 'flask' in command:
      if(os.name == 'nt'):
        command = command.replace('python', '.venv\\Scripts\\python.exe')
      else:
        command = command.replace('python', '.venv/bin/python')
    
    # Start the process (don't capture output for long-running processes)
    process = subprocess.Popen(command, cwd=directory, shell=True)
    
    print(f"{server_name} started with PID {process.pid}")
    return process
  
  except Exception as e:
    print(f"Error starting {server_name}: {e}")
    return None

def run():
  # Setup environments first
  print("Setting up environments...")
  # Neo4j configuration
  neo4jkeypath = config.get('Neo4j', 'Neo4jCertificatePath') # Needs to be filled in by user
  postgreskeypath = config.get('Postgres', 'PostgresCertificatePath')
  postgresversion = config.get('Postgres', 'PostgresVersion')
  shell = config.get('OSConfig', 'Shell')
  
  # Flask setup
  flask_cmd = 'python -m venv .venv'
  npm_install = ['npm install']
  if(os.name == 'nt'):
    flask_cmd += ' && .venv\\Scripts\\activate.bat && pip install -r requirements.txt && python dbcreation.py && mkdir keys && copy cert.conf keys\\cert.conf && cd keys && openssl req -x509 -newkey rsa:4096 -keyout skynet-key.pem -out skynet-cert.pem -days 365 -nodes -config cert.conf -extensions v3_req && powershell -Command "Import-Certificate -FilePath "skynet-cert.pem" -CertStoreLocation Cert:\\LocalMachine\\Root" && copy skynet-cert.pem ' + neo4jkeypath + ' && copy skynet-key.pem ' + neo4jkeypath + ' && copy skynet-cert.pem ' + postgreskeypath + ' && copy skynet-cert.pem ' + postgreskeypath + ' && del cert.conf && cd .. && net stop postgresql-x64-' + postgresversion + ' && net start postgresql-x64-' + postgresversion
    npm_install = ['npm', 'install']
  elif(os.uname().sysname == 'Darwin'):
    flask_cmd += ' && source .venv/bin/activate && pip install -r requirements.txt && python dbcreation.py && mkdir keys && cp cert.conf keys/cert.conf && cd keys && openssl req -x509 -newkey rsa:4096 -keyout skynet-key.pem -out skynet-cert.pem -days 365 -nodes -config cert.conf -extensions v3_req && sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain skynet-cert.pem && cp skynet-cert.pem ' + neo4jkeypath + '&& cp skynet-key.pem ' + neo4jkeypath + ' && rm cert.conf && cd ..'
  elif(os.uname().sysname == 'Linux'):
    flask_cmd += ' && source .venv/bin/activate && pip install -r requirements.txt && python dbcreation.py && mkdir keys && cp cert.conf keys/cert.conf && cd keys && openssl req -x509 -newkey rsa:4096 -keyout skynet-key.pem -out skynet-cert.pem -days 365 -nodes -config cert.conf -extensions v3_req && sudo cp skynet-cert.pem /usr/local/share/ca-certificates/skynet-cert.crt && sudo update-ca-certificates && cp skynet-cert.pem ' + neo4jkeypath + '&& cp skynet-key.pem ' + neo4jkeypath + ' && cp skynet-cert.pem ' + postgreskeypath + ' && cp skynet-cert.pem ' + postgreskeypath + ' && rm cert.conf && cd .. && sudo service postgresql restart'
  subprocess.run(flask_cmd, executable=shell, shell=True, cwd='skynet-ai-dev-flask-api')

  # Node.js setup
  print('installations')
  subprocess.run(npm_install, shell=True, cwd='skynet-neo')
  subprocess.run(npm_install, shell=True, cwd='skynet-react')

  # Start servers
  servers = [
    ('python -m flask --app skynet-ai-dev-flask-api run --cert=keys/skynet-cert.pem --key=keys/skynet-key.pem --host 0.0.0.0 --port 5002', 'skynet-ai-dev-flask-api', 'Flask'),
    ('npm run dev', 'skynet-neo', 'Neo'),
    ('npm run dev', 'skynet-react', 'React')
  ]

  processes = []

  with concurrent.futures.ThreadPoolExecutor(max_workers=len(servers)) as executor:
    futures = [
      executor.submit(setup_and_start_server, cmd, directory, name)
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
