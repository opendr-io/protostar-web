# Skynet Setup Guide

## Prereqs: 
- Node.js installation: https://nodejs.org/en/download
- Python installation: https://www.python.org/downloads/
- Postgres installation: https://www.postgresql.org/download/
- Homebrew installation: https://brew.sh/
- Chocolatey installation: https://chocolatey.org/install
- OpenSSL installation
	- macOS: brew install openssl
	- Windows: choco install openssl or https://slproweb.com/products/Win32OpenSSL.html
	- Linux: Installed by Default
- Pull Protostar GitHub repository: git pull https://github.com/opendr-io/protostar-web.git
- Neo4j Installation and Sample Data upload:
	1. https://neo4j.com/download/
	2. https://github.com/cyberdyne-ventures/skynet-data
	3. APOC Plugin installation --> https://neo4j.com/docs/apoc/current/installation/
	4. (Make sure the three steps above this have been completed before doing this step). Copy the Neo4j configuration that came with the repository. Both of these are under the skynet-ai-dev-flask-api folder and move the configuration based on whether you need TLS running or not into the conf directory the Neo4j instance has been installed in. The path to the configurations in the repository are listed below:
 		- Without TLS: skynet-ai-dev-flask-api/baseconfig/neo4j.conf
   		- With TLS: skynet-ai-dev-flask-api/tlsconfig/neo4j.conf

1.	This step is optional if you are going to run as localhost. If you would like to run the application and access it throughout your network, you will need to make changes in the following files in the skynet-react directory.
	- Find what your computer’s IP is on the network by using the following:
		- For Windows: wmic nicconfig where "IPEnabled='TRUE'" get IPAddress or ipconfig
		- For macOS: ipconfig getifaddr en0
		- For Linux: ip addr show eth0

	- Take the IP and replace the [your_server_ip] part of the URL in the following files:
		- skynet-react/.env: In this file change the following line VITE_REACT_APP_API_URL=http://[your_server_ip]
		- skynet-neo/.env: In this file change the following lines:
  			- VITE_NEO_APP_USERNAME="[neo_username]"
			- VITE_NEO_APP_PASSWORD="[neo_password]"
  			- VITE_NEO_APP_DB_URL="http://[neo_server_ip]:[port]/db/neo4j"

2.	Before you continue to the next step go to the following files:
	- dbconfig.ini under the skynet-ai-dev-flask-api directory and enter the information for the variables listed in the file.
 		- [Database]
			- HostName=[host_name_of_database]
			- PortNumber=[port_where_postgres_is_running_from]
			- DatabaseName=protostar
			- RootDatabaseUserName=[postgres_root_user]
			- RootDatabasePassword=[postgres_root_password]
			- ApplicationUser=[The_first_user_of_application]
			- ApplicationUserPassword=[Password_of_the_first_user_of_application]

	- Go to the agentconfig.ini under skynet-ai-dev-flask-api directory and enter your API key for one of the LLM providers. Here are the options:
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

3. If you would like setup TLS set the following flag to true in the secureconfig.ini file.
	- [General]
		- TLS=True

	- In the secureconfig.ini file set the directories where Neo4j and Postgres config files are stores. This is typically under their installation directories. If you set TLS to true in the step above go to the secureconfig.ini in the top directory and enter the path for where Neo4j stores its TLS certificates. There should be an https directory under certificates and if not create a new folder called https under certificates wherever Neo4j configurations are stored. In Postgres, the certificates are stored in the data directory where the configurations are stored.

		- [Neo4j]
			- Neo4jCertificatePath=""
			- Neo4jConfigPath=""

		- [Postgres]
			- PostgresCertificatePath=""
			- PostgresConfigPath="" 

4.	Once you have completed steps above, run the following command in the root directory:
	- sudo python startup.py: macOS or Linux
	- python startup.py: make sure PowerShell is in Administrator mode
	- You may need to enter your password to apply certificates to Neo4j. On Windows instead of a password a popup will ask if you would like to have the certificates applied.
	- Once the certificates are applied restart Neo4j from Neo4j Desktop or terminal so that it will use the generated certificates.
