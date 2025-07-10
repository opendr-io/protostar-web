# Skynet Setup Guide

## Prereqs: 
- Node.js installation: https://nodejs.org/en/download
- Python installation: https://www.python.org/downloads/
- Postgres installation: https://www.postgresql.org/download/
- Homebrew installation: https://brew.sh/
- Chocolatey installation: https://chocolatey.org/install
- Neo4j Installation and Sample Data upload:
	- https://neo4j.com/download/
	- https://github.com/cyberdyne-ventures/skynet-data
	- APOC Plugin installation --> https://neo4j.com/docs/apoc/current/installation/
	- In Windows you will need to do the following:
		- Add the location of where the bin folder for your Neo4j instance is stored to your PATH environment variable
		- Run the following in the Command Line: neo4j windows-service install or bin\neo4j windows-service install
	- To have Neo4j listen on all addresses set server.default_listen_address=0.0.0.0 in the neo4j.conf file in the directory of the instance installation.
- OpenSSL installation
	- macOS: brew install openssl
	- Windows: choco install openssl or https://slproweb.com/products/Win32OpenSSL.html
	- Linux: Installed by Default

1.	Pull the following from GitHub to a directory of your choice. Once pulled navigate to the directory the repository was pulled to. Use the following command to pull the repository:
	- git pull https://github.com/cyberdyne-ventures/genisys

2.	This step is optional if you are going to run as localhost. If you would like to run the application and access it throughout your network, you will need to make changes in the following files in the skynet-react directory.
	- Find what your computer’s IP is on the network by using the following:
		- For Windows: wmic nicconfig where "IPEnabled='TRUE'" get IPAddress or ipconfig
		- For macOS: ipconfig getifaddr en0
		- For Linux: ip addr show eth0

	- Take the IP and replace the [your_server_ip] part of the URL in the following files:
		- skynet-react/src/config/config.tsx: In this file change the url variable in the constructor to the ip address that you found in the step above.
		- skynet-neo/.env: Place the IP of your Neo4j instance is running from.

3.	Before you continue to the next step go to the following files:
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

4. If you would like setup TLS set the following flag to true in the secureconfig.ini file.
	- [General]
		- TLS=True

	- In the secureconfig.ini file set the directories where Neo4j and Postgres config files are stores. This is typically under their installation directories. If you set TLS to true in the step above go to the secureconfig.ini in the top directory and enter the path for where Neo4j stores its TLS certificates. There should be an https directory under certificates and if not create a new folder called https under certificates wherever Neo4j configurations are stored.

		- [Neo4j]
			- Neo4jCertificatePath=""
			- Neo4jConfigPath=""

		- [Postgres]
			- PostgresCertificatePath=""
			- PostgresConfigPath="" 

5.	Once you have completed steps above, run the following command in the root directory:
	- sudo python startup.py: macOS or Linux
	- python startup.py: make sure PowerShell is in Administrator mode
	- You may need to enter your password to apply certificates to Neo4j. On Windows instead of a password a popup will ask if you would like to have the certificates applied.
	- Once the certificates are applied restart Neo4j from Neo4j Desktop or terminal so that it will use the generated certificates.