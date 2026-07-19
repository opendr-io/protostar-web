import subprocess
import concurrent.futures
import os
import time

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
  # Dev mode: no installs, no builds. Run startup.py once first to set up the
  # venv, node_modules, and databases.
  # - Flask runs without --debug
  # - React/Neo run under the Vite dev server: frontend edits hot-reload in the
  #   browser, no rebuild or hard refresh needed
  servers = [
    ('python -m flask --app protostar-ai-dev-flask-api run --host 0.0.0.0 --port 5002', 'protostar-ai-dev-flask-api', 'Flask (dev)'),
    ('npm run dev -- --host --port 3000', 'protostar-neo', 'Neo (vite dev)'),
    ('npm run dev -- --host --port 5173', 'protostar-react', 'React (vite dev)')
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
  print("React: http://localhost:5173  Neo: http://localhost:3000  Flask API: http://localhost:5002")
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

if __name__ == "__main__":
  run()
