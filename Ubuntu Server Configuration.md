# Developer Guide to Server Setup \& Configuration on Ubuntu

This guide provides a comprehensive set of instructions for setting up and managing a development environment on an Ubuntu server. It covers initial server security, file transfers, installing language runtimes, and managing popular database systems like PostgreSQL and Neo4j.

## Chapter 1: Initial Server Security with UFW

A properly configured firewall is the first line of defense for your server. UFW (Uncomplicated Firewall) provides a user-friendly way to manage firewall rules.

### Enabling UFW

By default, UFW is installed but inactive. Before enabling it, you must add a rule to allow SSH access to avoid locking yourself out of a remote server.

1. **Allow SSH Connections**:

```bash
sudo ufw allow ssh
```

2. **Enable UFW**:

```bash
sudo ufw enable
```

When prompted, type `y` to proceed. The firewall will now be active and will launch on system boot.

### Managing UFW

* **Check Status**: To see the current status and all active rules, run:

```bash
sudo ufw status verbose
```

* **Restarting UFW**: To perform a full restart, you must disable and then re-enable the firewall.

```bash
sudo ufw disable
sudo ufw enable
```

* **Reloading Rules**: To apply rule changes without dropping existing connections, use the `reload` command.

```bash
sudo ufw reload
```


## Chapter 2: Essential Tools and Configuration

### Secure File Transfer with `scp`

Secure Copy Protocol (`scp`) is used to transfer files securely between your local machine and a remote server over SSH.

* **Copying a File to a Server**:

```bash
scp /path/to/local/file username@server_ip:/path/to/remote/directory
```

* **Copying a Directory to a Server**: To copy an entire directory and its contents, use the `-r` (recursive) flag.

```bash
scp -r /path/to/local/directory username@server_ip:/path/to/remote/directory
```


### Configuring the Nano Text Editor

You can configure the `nano` text editor to always display line numbers for easier navigation.

1. **Open the configuration file**:

```bash
nano ~/.nanorc
```

2. **Add the setting**: Add the following line to the file:

```
set linenumbers
```

3. **Save the file**: Press `Ctrl+X`, then `Y`, then `Enter`.

## Chapter 3: Installing Programming Languages \& Runtimes

### Installing Node.js

* **Method 1: Using NodeSource PPA (Recommended for newer versions)**

1. Add the NodeSource repository for the desired major version (e.g., 20).

```bash
NODE_MAJOR=20
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
```

2. Install Node.js.

```bash
sudo apt-get update
sudo apt-get install nodejs -y
```

* **Method 2: Using Node Version Manager (NVM) (For managing multiple versions)**

1. Install NVM.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

2. Activate NVM by closing and reopening your terminal or running `source ~/.bashrc`.
3. Install a version of Node.js.

```bash
nvm install node # Installs the latest version
```


### Installing Go (Golang)

* **Method 1: From Official Binaries (Recommended)**

1. Download the latest archive from the Go downloads page.

```bash
wget https://go.dev/dl/go1.21.4.linux-amd64.tar.gz
```

2. Extract the archive to `/usr/local`.

```bash
sudo tar -C /usr/local -xzf go1.21.4.linux-amd64.tar.gz
```

3. Add Go to your PATH.

```bash
echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.profile
source ~/.profile
```

4. Verify the installation.

```bash
go version
```


## Chapter 4: PostgreSQL Database Management

### Installation and Access

1. **Install PostgreSQL**: It is recommended to use the official PostgreSQL repository to get the latest version.

```bash
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
sudo apt update
sudo apt -y install postgresql
```

2. **Access the `psql` Shell**: PostgreSQL creates a system user called `postgres`. To manage the database, you must switch to this user.

```bash
sudo -i -u postgres
psql
```


### User and Database Management

* **Set a Password**: The `postgres` user has no password by default. To set one, use the `ALTER USER` command inside the `psql` shell.

```sql
ALTER USER postgres PASSWORD 'your_strong_password';
```

* **Delete a User**: Use the `DROP USER` command.

```sql
DROP USER username_to_delete;
```

* **Find Tables**: After connecting to a database with `\c database_name`, use the `\dt` command.

```sql
\dt
```

* **Delete a Database**:

```sql
DROP DATABASE database_name;
```


### Network and Firewall Configuration

1. **Allow Remote Connections**: Edit `/etc/postgresql/<version>/main/postgresql.conf` and change `listen_addresses = 'localhost'` to `listen_addresses = '*'`. Restart the service with `sudo systemctl restart postgresql`.
2. **Configure UFW**: Allow traffic on the default PostgreSQL port (5432). For better security, restrict this to a specific IP.

```bash
# Allow from a specific IP
sudo ufw allow from your_clients_ip to any port 5432
```


## Chapter 5: Neo4j Graph Database Management

### Installation and Setup

1. **Install Neo4j**: Use the official Neo4j repository.

```bash
curl -fsSL https://debian.neo4j.com/neotechnology.gpg.key | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/neo4j.gpg
echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt update
sudo apt install neo4j
```

2. **Start and Enable the Service**:

```bash
sudo systemctl start neo4j
sudo systemctl enable neo4j.service
```

3. **Access Neo4j**: Open a web browser to `http://localhost:7474`. The default username and password are both `neo4j`. You will be prompted to change the password on the first login.

### Plugin Installation: APOC

The APOC library extends Neo4j's capabilities.

1. **Find your Neo4j version**: `neo4j-admin --version`.
2. **Download the matching APOC `.jar` file** from the APOC GitHub releases page. The version numbers must align (e.g., Neo4j `2025.05` requires APOC `2025.05.x`).
3. **Move the plugin**:

```bash
sudo mv /path/to/downloaded/apoc-*.jar /var/lib/neo4j/plugins/
```

4. **Configure Neo4j**: Add the following line to `/etc/neo4j/neo4j.conf`:

```ini
dbms.security.procedures.unrestricted=apoc.*
```

5. **Restart Neo4j**: `sudo systemctl restart neo4j`.

### Network and Troubleshooting

* **Allow Remote Connections**: Edit `/etc/neo4j/neo4j.conf` and uncomment the line `server.default_listen_address=0.0.0.0`. Restart the service.
* **Configure UFW**: Open the necessary ports for Neo4j.
    * `7474`: HTTP Browser
    * `7687`: Bolt Connector

```bash
sudo ufw allow 7474/tcp
sudo ufw allow 7687/tcp
```

* **Fixing "Connection Refused"**: This error usually means one of three things:

1. The Neo4j service is not running (`sudo systemctl status neo4j`).
2. Neo4j is not configured for remote connections (check `server.default_listen_address`).
3. A firewall is blocking the port (check `ufw status`).


## Chapter 6: Common Troubleshooting

### Python: "source: not found" Error

This error occurs when a script using the `source` command is run with `/bin/sh` (which is often `dash`) instead of `bash`.

* **Solution**: Replace `source` with the POSIX-compliant dot (`.`) command.
    * **Change this**: `source my_venv/bin/activate`
    * **To this**: `. my_venv/bin/activate`

<div style="text-align: center">⁂</div>

[^1]: https://www.baeldung.com/linux/pdf-markdown-conversion

[^2]: https://linuxconfig.org/how-to-convert-markdown-to-pdf-on-linux

[^3]: https://unix.stackexchange.com/questions/710817/convert-markdown-to-pdf-in-commandline

[^4]: https://www.mscharhag.com/software-development/pandoc-markdown-to-pdf

[^5]: https://www.docstomarkdown.pro/convert-markdown-to-pdf-using-pandoc/

[^6]: https://stackoverflow.com/questions/48821981/how-to-convert-markdown-to-pdf-in-command-line

[^7]: https://github.com/simonhaenisch/md-to-pdf

[^8]: https://github.com/elliotblackburn/mdpdf

[^9]: https://dev.to/waylonwalker/converting-markdown-to-pdf-with-pandoc-on-linux-248b

[^10]: https://news.ycombinator.com/item?id=43231964
