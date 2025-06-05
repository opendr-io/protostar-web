import subprocess
import concurrent.futures
import sys
import os

def execute_scripts(command, directory):
  try:
    result = subprocess.run(command, cwd=directory, shell=True, capture_output=True, text=True)
    return command, directory, result.stdout, result.stderr, result.returncode
  except Exception as e:
    return command, directory, "", str(e), -1

def run():
  commands = ['npm start', 'npm run dev']
  directories = ['skynet-neo', 'skynet-react']
  
  with concurrent.futures.ThreadPoolExecutor(max_workers=len(commands)) as executor:
    futures = [executor.submit(execute_scripts, cmd, dir) for cmd, dir in zip(commands, directories)]
    for future in concurrent.futures.as_completed(futures):
      command, directory, stdout, stderr, returncode = future.result()
      print(f"Results from '{command}' in directory '{directory}':")
      print(f"Return code: {returncode}")
      if stdout:
        print(f"STDOUT:\n{stdout}")
      if stderr:
        print(f"STDERR:\n{stderr}")
      print("-" * 50)
  original_cwd = os.getcwd()
  os.chdir('skynet-ai-dev-flask-api')
  print(sys.executable)
  subprocess.run([sys.executable, '-m', 'flask', '--app', 'skynet-ai-dev-flask-api', 'run', '--host', '0.0.0.0', '--port', '5002'])
      
if __name__ == "__main__":
  subprocess.run(['npm', 'install'], shell=True, cwd='skynet-neo')
  subprocess.run(['npm', 'install'], shell=True, cwd='skynet-react')
  subprocess.run(['python', '-m', 'venv', '.venv'], shell=True, cwd='skynet-ai-dev-flask-api')
  subprocess.run(['.venv/Scripts/python.exe', '-m', 'pip', 'install', '-r', 'requirements.txt'], shell=True, cwd='skynet-ai-dev-flask-api')
  run()