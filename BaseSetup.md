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
1. To run the application across the network, make changes to the following files in the following directories:
   - skynet-react/.env: In this file change the following line VITE_REACT_APP_API_URL=http://[server_hostname]
   - skynet-neo/.env: In this file change the following lines: VITE_NEO_APP_DB_URL="http://[server_hostname]:[port]/db/neo4j"

2. Navigate to the baseconfig directory under the skynet-ai-dev-flask-api directory and make the appropriate edits to the following files: (Note: These files already have the needed configuration to run across a network but can be configured futher based on user needs.)
	 - pg_hba.conf
	 - postgres.conf
	 - Copy and paste these files to the data directory in Postgres. The location of Postgres configuration files defaults to C:\Program Files\Postgres\\[postgres_version]\data in Windows.

3. Repeat the following for Neo4j. The neo4j.conf is located in baseconfig under the skynet-ai-dev-flask-api directory. Make further edits if needed and copy and paste this file to conf directory to where neo4j is installed. This is typically under the user directory. For example: C:\Users\\[username]\\.Neo4jDesktop2\Data\dbmss\\[instance_id]\conf in Windows.

4. Enter database information in the dbconfig.ini file which is located under skynet-ai-dev-flask-api directory 
	- Enter the information for the variables listed in the file.
 		- [Database]
			- HostName=[ip_of_postgres_db]
			- PortNumber=[port_where_postgres_is_running_from]
			- DatabaseName=protostar
			- RootDatabaseUserName=[postgres_root_user]
			- RootDatabasePassword=[postgres_root_password]
			- ApplicationUser=[The_first_user_of_application]
			- ApplicationUserPassword=[Password_of_the_first_user_of_application]

5. To run agents in the application enter information in agentconfig.ini in the skynet-ai-dev-flask-api directory:
	- [Anthropic]
		- ModelName=
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

6. Once thse steps have been completed run the following command: python startup.py
