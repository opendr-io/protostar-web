import subprocess
import concurrent.futures

def execute_scripts(command, directory):
  try:
    result = subprocess.run(command, cwd=directory, shell=True, capture_output=True, text=True)
    return command, directory, result.stdout, result.stderr, result.returncode
  except Exception as e:
    return command, directory, "", str(e), -1

def run():
  commands = ['npm install', 'npm start', 'flask --app skynet-ai-dev-flask-api run --host 0.0.0.0 --port 5002', 'npm install', 'npm run dev']
  directories = ['skynet-neo', 'skynet-neo', 'skynet-ai-dev-flask-api', 'skynet-react', 'skynet-react']
  
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

if __name__ == "__main__":
  run()