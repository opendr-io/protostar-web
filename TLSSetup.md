# Protostar TLS Setup Guide
## Prereqs
- Visual Studio Code (optional, helps make the installation process easier): https://code.visualstudio.com/
- Java LTS Installation: https://www.oracle.com/java/technologies/downloads/#jdk21-linux
- Node.js installation: https://nodejs.org/en/download
	- Once installed run the following commands:
		- npm i -g serve
		- npm i -g cross-env
- Python installation: https://www.python.org/downloads/
- Postgres installation: https://www.postgresql.org/download/
- Homebrew installation (if using macOS): https://brew.sh/
- Golang installation: https://go.dev/doc/install
- Pull Protostar GitHub repository: git pull https://github.com/opendr-io/protostar-web.git
- Find hostname of your machine by entering the following command in PowerShell, Command Prompt, or Terminal: hostname

- Neo4j Installation and Sample Data upload:
	1. Pull the following repository with the following command: git pull https://github.com/opendr-io/protostar-data
	2. Instructions on how to get the data uploaded: https://github.com/opendr-io/protostar-data/blob/main/SETUP.md
	3. Instructions for APOC Plugin installation
    - For versions 1.x: https://neo4j.com/docs/apoc/current/installation/
    - For versions 2.x: APOCSetup.md

1. Navigate to the baseconfig directory under the skynet-ai-dev-flask-api directory and make the appropriate edits to the following files: (Note: These files already have the needed configuration to run across a network but can be configured futher based on user needs.)
	 - pg_hba.conf
	 	-	Parts of the file that are edited:

			**Located on line 18**
	 		-	hostssl all all 0.0.0.0/0 md5 <-- Needed to allow all hosts on the network to access the databae. This should be on line 18 should the user decide to modify this.
	 - postgres.conf
	 	- Parts of the file that are edited:

			**Located between lines 60-64**
			- listen_addresses = '*' <-- Needed to allow application to know which IP to connect to. Located on line 60. Modify this if needed.
			- port = 5432 <-- Needed to tell which port the application will need to connect to. Located on line 64. Modify this if needed.

				**Located between lines 107-120**
					- ssl = on
					- #ssl_ca_file = ''
					- ssl_cert_file = 'protostar-server.crt'
					- #ssl_crl_file = ''
					- #ssl_crl_dir = ''
					- ssl_key_file = 'protostar-server.key'
					- ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'	# allowed SSL ciphers

2. Navigate to the baseconfig under the skynet-ai-dev-flask-api directory again and make the appropriate edits to the following file for Neo4j: (Note: These files already have the needed configuration to run across a network but can be configured futher based on user needs.)
   - neo4j.conf

        **Below is on line 100. This is needed to allow for the database to communicate across the network**
        - server.default_listen_address=0.0.0.0
        
        **Below are between lines 118 and 132**
        - server.bolt.enabled=true
        - server.bolt.tls_level=REQUIRED
        - server.bolt.listen_address=:7687

        - server.https.enabled=true
        - server.https.listen_address=:7473

        **Below are between lines 187 and 200**
        - dbms.ssl.policy.bolt.enabled=true
        - dbms.ssl.policy.bolt.base_directory=certificates
        - dbms.ssl.policy.bolt.private_key=protostar-key.pem
        - dbms.ssl.policy.bolt.public_certificate=protostar-cert.pem

        - dbms.ssl.policy.https.enabled=true
        - dbms.ssl.policy.https.base_directory=certificates
        - dbms.ssl.policy.https.private_key=protostar-key.pem
        - dbms.ssl.policy.https.public_certificate=protostar-cert.pem

   - Make the necessary changes and copy the needed configuration changes for Neo4j. The config file for Neo4j is located in:
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
      - SSLMode=[ssl_settings] --> Link to find options: https://www.postgresql.org/docs/current/libpq-ssl.html
			- SSLRootCert=[root_cert]
			- ApplicationUser=[The_first_user_of_application]
			- ApplicationUserPassword=[Password_of_the_first_user_of_application]

4. Fill out the information in secureconfig.ini located in the base directory. The other fields can be left blank. Needed to run the startup.py script.
	- [General]
		- TLS=True

	- [Postgres]
		- PostgresVersion=
		- PostgresCertificatePath=""

	- [Neo4j]
		- Neo4jCertificatePath="" <--- Below are where the path is located in these operating systems
			- Windows: C:\Users\\[username]\\.Neo4jDesktop2\Data\dbmss\\[instance_id]\certificate
			- Linux: /home/[username]/.config/neo4j-desktop/Application/Data/dbmss/[instance_id]/certificate
			- MacOS: /Users/[username]/Library/Application Support/Neo4j Desktop/Application/relate-data/dbmss/[instance_id]/certificate

		- Neo4jPath="" <--- Below are where the path is located in these operating systems
			- Windows: C:\Users\\[username]\\.Neo4jDesktop2\Data\dbmss\\[instance_id]\bin
			- Linux: /home/[username]/.config/neo4j-desktop/Application/Data/dbmss/[instance_id]/bin
			- MacOS: /Users/[username]/Library/Application Support/Neo4j Desktop/Application/relate-data/dbmss/[instance_id]/bin
	
	- [OSConfig]
		-	shell= <-- Keep blank if using Windows.

5. Navigate to cert.conf skynet-ai-dev-flask-api and alter the followwing configurations:
	- [dn]
		- CN=[your_hostname]

	- [alt_names]
		- DNS.1 = localhost
		- DNS.2 = 127.0.0.1
		- DNS.3 = [your_hostname] <--- The hostname of the server
		- IP.1 = 127.0.0.1
		- IP.2 = [your_server_ip] <--- The IP of the server

6. To run the application across the network, make changes to the following files in the following directories:
   - skynet-react/.env: In this file change the following line VITE_REACT_APP_API_URL=https://[server_hostname]
   - skynet-neo/.env: In this file change the following lines: VITE_NEO_APP_DB_URL="https://[server_hostname]:7473/db/neo4j"

7. To be able to run using hostname modify allowedHosts settings in the following paths:
	- skynet-react/vite.config.ts
    - https: true
		- allowedHosts: ['your_hostname'] 
	- skynet-neo/vite.config.ts
    - https: true
		- allowedHosts: ['your_hostname']

8. In skynet-ai-dev-flask-api\services\telemetryservice.py, modify the following on line 10:
  - bolt://localhost:7687 --> bolt+ssc://[your_hostname]:7687

9. For LLM support and to run agents in the application enter information in agentconfig.ini in the skynet-ai-dev-flask-api directory: (Note: All of these don't need to be filled out. Just the ones that the user will want to use for the application. The application default is Athropic and the default model is claude-opus-4-20250514 which is shown below. This can be changed based on user preference.)
	- [Anthropic]
		- ModelName=claude-3-7-sonnet-20250219
		- AnthropicKey=
			
	- [OpenAI]
		- ModelName=
		- OpenAIKey=

	- [LMStudio]
		- ModelName=
		- LMStudio=NotRequired

	- [Perplexity]
		- ModelName=

10. Once thse steps have been completed run the following command (Make sure you are running the command prompt or PowerShell in Administrator mode in Windows when running this command. If an error comes up rerun the command again):
	- sudo python startup.py