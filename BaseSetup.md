# Skynet Setup Guide
## Prereqs
- Visual Studio Code (optional, helps make the installation process easier): https://code.visualstudio.com/
- Node.js installation: https://nodejs.org/en/download
- Python installation: https://www.python.org/downloads/
- Postgres installation: https://www.postgresql.org/download/
- Homebrew installation (if using macOS): https://brew.sh/
- Golang installation: https://go.dev/doc/install
- Pull Protostar GitHub repository: git pull https://github.com/opendr-io/protostar-web.git
- Find hostname of your machine by entering the following command in PowerShell, Command Prompt, or Terminal: hostname

- Neo4j Installation and Sample Data upload:
	1. Pull the following repository with the following command: git pull https://github.com/opendr-io/protostar-data
	2. Instructions on how to get the data uploaded: https://github.com/opendr-io/protostar-data/blob/main/SETUP.md
	3. Instructions for APOC Plugin installation --> https://neo4j.com/docs/apoc/current/installation/

## Setup
1. Navigate to the baseconfig directory under the skynet-ai-dev-flask-api directory and make the appropriate edits to the following files: (Note: These files already have the needed configuration to run across a network but can be configured futher based on user needs.)
	 - pg_hba.conf
	 	-	Parts of the file that are edited:
	 		-	host all all 0.0.0.0/0 md5 <-- Needed to allow all hosts on the network to access the databae. This should be on line 18 should the user decide to modify this.
	 - postgres.conf
	 	- Parts of the file that are edited:
			- listen_addresses = '*' <-- Needed to allow application to know which IP to connect to. Located on line 60. Modify this if needed.
			- port = 4000 <-- Needed to tell which port the application will need to connect to. Located on line 64. Modify this if needed.
	 - Copy and paste these files to the data directory in Postgres which is typically located in the following:
	 	- Windows: C:\Program Files\Postgres\\[postgres_version]\data 
		- Linux: /etc/postgresql/[postgres_version]/main

2. Navigate to the baseconfig under the skynet-ai-dev-flask-api directory again and make the appropriate edits to the following file for Neo4j: (Note: These files already have the needed configuration to run across a network but can be configured futher based on user needs.)
   - neo4j.conf
	 	- Parts of the file that are edited:
			- server.default_listen_address=0.0.0.0 <-- Needed to allow the database to allow connections from across the network. This setting should be on line 100 of the file should the user decide to modify the setting.
   - Take the changes and copy the needed configuration changes for Neo4j. The config file for Neo4j is located in:
	 	- Windows: C:\Users\\[username]\\.Neo4jDesktop2\Data\dbmss\\[instance_id]\conf
		- Linux: /home/[username]/.config/neo4j-desktop/Application/Data/dbmss/[instance_id]/conf
		- MacOS: /Users/[username]/Library/Application Support/Neo4j Desktop/Application/relate-data/dbmss/[instance_id]/conf

3. Enter database information in the dbconfig.ini file which is located under skynet-ai-dev-flask-api directory. This is needed to setup the database tables and users for Protostar.
	- Enter the information for the variables listed in the file:
 		- [Database]
			- HostName=[ip_of_postgres_db]
			- PortNumber=[port_where_postgres_is_running_from]
			- DatabaseName=protostar
			- RootDatabaseUserName=[postgres_root_user]
			- RootDatabasePassword=[postgres_root_password]
			- ApplicationUser=[The_first_user_of_application]
			- ApplicationUserPassword=[Password_of_the_first_user_of_application]

4. Fill out the information in secureconfig.ini located in the base directory. The other fields can be left blank. Needed to run the startup.py script.
	- [General]
		- TLS=False

	- [Postgres]
		- PostgresVersion=
	
	- [OSConfig]
		-	shell= <-- Keep blank if using Windows.

5. To run the application across the network, make changes to the following files in the following directories:
   - skynet-react/.env: In this file change the following line VITE_REACT_APP_API_URL=http://[server_hostname]
   - skynet-neo/.env: In this file change the following lines: VITE_NEO_APP_DB_URL="http://[server_hostname]:[port]/db/neo4j"

6. To be able to run using hostname modify allowedHosts settings in the following paths:
	- skynet-react/vite.config.ts
		- allowedHosts: ['your_hostname'] 
	- skynet-neo/vite.config.ts
		- allowedHosts: ['your_hostname']

7. For LLM support and to run agents in the application enter information in agentconfig.ini in the skynet-ai-dev-flask-api directory: (Note: All of these don't need to be filled out. Just the ones that the user will want to use for the application. The application default is Athropic and the default model is claude-opus-4-20250514 which is shown below. This can be changed based on user preference.)
	- [Anthropic]
		- ModelName=claude-opus-4-20250514
		- AnthropicKey=
			
	- [OpenAI]
		- ModelName=
		- OpenAIKey=

	- [LMStudio]
		- ModelName=
		- LMStudio=NotRequired

	- [Perplexity]
		- ModelName=
		- PerplexityKey=

8. Once thse steps have been completed run the following command (Make sure you are running the command prompt or PowerShell in Administrator mode in Windows when running this command):
	- sudo python startup.py
