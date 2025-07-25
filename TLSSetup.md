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
1. Navigate to the tlsconfig directory under the skynet-ai-dev-flask-api directory and make the appropriate edits to the following files: (Note: These files already have the needed configuration to run across a network but can be configured futher based on user needs.)
	 - pg_hba.conf
	 	-	Parts of the file that are edited:
	 		-	host all all 0.0.0.0/0 md5 <-- Needed to allow all hosts on the network to access the databae. This should be on line 18 should the user decide to modify this.
      - hostssl all all 172.16.200.165/0 md5 <-- Needed to allow all hosts on the network to access the databae via TLS. This should be on line 18 or line 19 should the user decide to modify this.

	 - postgres.conf
	 	- Parts of the file that are edited:
			- listen_addresses = '*' <-- Needed to allow application to know which IP to connect to. Located on line 60. Modify this if needed.
			- port = 4000 <-- Needed to tell which port the application will need to connect to. Located on line 64. Modify this if needed.
      - ssl = on <--- This is located on or around 107 in the config file.
      - ssl_cert_file = '' <--- This is located on or around 109 in the config file.
      - ssl_key_file = '' <--- This is located on or around 112 in the config file.
      - ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL' <--- This is located on or around 113 in the config file.
      - ssl_prefer_server_ciphers = on <--- This is located on or around 114 in the config file.
	 - Copy and paste these files to the data directory in Postgres which is typically located at C:\Program Files\Postgres\\[postgres_version]\data in Windows.

2. Navigate to the tlsconfig under the skynet-ai-dev-flask-api directory again and make the appropriate edits to the following file for Neo4j: (Note: These files already have the needed configuration to run across a network but can be configured futher based on user needs.)
   - neo4j.conf
	 	- Parts of the file that are edited:
			- server.default_listen_address=0.0.0.0 <-- Needed to allow the database to allow connections from across the network. This setting should be on line 100 of the file should the user decide to modify the setting.

      - server.bolt.enabled=true <-- Needed to enable bolt on Neo4j.
      - server.bolt.tls_level=REQUIRED <-- Needed to require TLS on bolt protocol. Located on or around line 120 in the file.
      - server.bolt.listen_address=:7687 <-- Needed to run TLS via this port using the bolt protocol. Located on or around line 121 in the file.

      - server.http.enabled=true <--- Needed if HTTP support is still needs to enabled. Located on or around line 125
      - server.http.listen_address=:7474 <--- Port needed to run HTTP through. Located on or around line 126
      - server.https.enabled=true <--- Needed to enable HTTPS. Located on or around line 130
      - server.https.listen_address=:7473 <--- Port needed to run HTTPS through. Located on or around line 131

      - dbms.ssl.policy.bolt.enabled=true <-- Needed to enable TLS for bolt on Neo4j.
      - dbms.ssl.policy.bolt.base_directory=[your_cert_directory] <-- Needed to tell Neo4j where the cetificates and keys are located for TLS to work with bolt. Located on or around line 189
      - dbms.ssl.policy.bolt.private_key=[your_private_key] <-- Needed to tell Neo4j where the private key is for TLS to work on bolt. Located on or around line 190
      - dbms.ssl.policy.bolt.public_certificate=[your_certificate] <-- To tell Neo4j where the public certificate is for TLS to work on bolt. Located on or around line 191.

      - dbms.ssl.policy.https.enabled=true <-- Needed to enable TLS for https. Located on or around line 195
      - dbms.ssl.policy.https.base_directory=[your_cert_directory] <-- Needed to tell Neo4j where the cetificates and keys are located for TLS to work with bolt. Located on or around line 196
      - dbms.ssl.policy.https.private_key=[your_private_key]  <-- To tell Neo4j where the private key is for TLS to work on HTTP. Located on or around line 197.
      - dbms.ssl.policy.https.public_certificate=[your_certificate] <-- To tell Neo4j where the public certificate is for TLS to work on HTTP. Located on or around line 198.

   - Copy and paste this file to conf directory to where neo4j is installed which is typically located at C:\Users\\[username]\\.Neo4jDesktop2\Data\dbmss\\[instance_id]\conf in Windows.

3. Go to cert.conf in skynet-ai-dev-flask-api and enter the following on line 18:
  - IP.2 = [your_server_ip_or_hostname]

4. Enter database information in the dbconfig.ini file which is located under skynet-ai-dev-flask-api directory. This is needed to setup the database tables and users for Protostar.
	- Enter the information for the variables listed in the file:
 		- [Database]
			- HostName=[ip_of_postgres_db]
			- PortNumber=[port_where_postgres_is_running_from]
			- DatabaseName=protostar
			- RootDatabaseUserName=[postgres_root_user]
			- RootDatabasePassword=[postgres_root_password]
			- ApplicationUser=[The_first_user_of_application]
			- ApplicationUserPassword=[Password_of_the_first_user_of_application]

5. To run the application across the network, make changes to the following files in the following directories:
   - skynet-react/.env: In this file change the following line VITE_REACT_APP_API_URL=http://[server_hostname]
   - skynet-neo/.env: In this file change the following lines: VITE_NEO_APP_DB_URL="http://[server_hostname]:[port]/db/neo4j"

6. For LLM support and to run agents in the application enter information in agentconfig.ini in the skynet-ai-dev-flask-api directory: (Note: All of these don't need to be filled out. Just the ones that the user will want to use for the application. The application default is Athropic and the default model is claude-opus-4-20250514 which is shown below. This can be changed based on user preference.)
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

7. Once thse steps have been completed run the following command: python startup.py
