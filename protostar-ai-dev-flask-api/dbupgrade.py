import sys
import psycopg
import bcrypt
import configparser
from pathlib import Path

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "dbconfig.ini")

def upgrade_database(dbname):
  print(f'Upgrading database: {dbname}')
  with psycopg.connect(host=config.get('Database', 'HostName'), port=config.get('Database', 'PortNumber', fallback='5432'), dbname=dbname,
  user=config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=config.get('Database', 'RootDatabasePassword'), autocommit=True) as connection:
    with connection.cursor() as cursor:

      cursor.execute("""select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'appusers' and column_name = 'username' and is_nullable = 'NO'""")
      if cursor.fetchone() is None:
        cursor.execute("ALTER TABLE appusers ALTER COLUMN username SET NOT NULL")
        print('appusers.username: NOT NULL added')
      else:
        print('appusers.username: NOT NULL already present')

      cursor.execute("""select 1 from information_schema.table_constraints
        where table_schema = 'public' and table_name = 'appusers' and constraint_type = 'UNIQUE'""")
      if cursor.fetchone() is None:
        cursor.execute("ALTER TABLE appusers ADD CONSTRAINT appusers_username_key UNIQUE (username)")
        print('appusers.username: UNIQUE constraint added')
      else:
        print('appusers.username: UNIQUE constraint already present')

      cursor.execute("""CREATE TABLE IF NOT EXISTS cases (
        case_id serial PRIMARY KEY,
        assigned_user TEXT REFERENCES appusers(username),
        casename TEXT NOT NULL, description TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        investigated_entity TEXT NOT NULL,
        properties JSONB, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP)""")
      print('cases table: ok')

      cursor.execute("""CREATE TABLE IF NOT EXISTS case_comments (
        comment_id SERIAL PRIMARY KEY,
        case_id INTEGER REFERENCES cases(case_id),
        comment_user TEXT REFERENCES appusers(username),
        comment TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)""")
      print('case_comments table: ok')

      cursor.execute("""select 1 from information_schema.table_constraints
        where table_schema = 'public' and table_name = 'cases' and constraint_type = 'UNIQUE'""")
      if cursor.fetchone() is None:
        try:
          cursor.execute("ALTER TABLE cases ADD CONSTRAINT cases_investigated_entity_key UNIQUE (investigated_entity)")
          print('cases.investigated_entity: UNIQUE constraint added')
        except Exception as exc:
          print(f'cases.investigated_entity: could NOT add UNIQUE constraint - remove duplicate-entity cases first ({exc})')
      else:
        print('cases.investigated_entity: UNIQUE constraint already present')

      cursor.execute("""update cases set properties = coalesce(properties, '{}'::jsonb) || '{"agent_status": "processed"}'::jsonb
        where properties->>'agent_status' is null
        and case_id in (select distinct case_id from case_comments where comment_user = 'agent' and comment <> '')""")
      print(f'agent_status backfilled on {cursor.rowcount} case(s) with existing agent comments')

      agent_user = config.get('Database', 'AgentUser', fallback='agent')
      cursor.execute("select 1 from appusers where username = %s", (agent_user,))
      if cursor.fetchone() is None:
        password = config.get('Database', 'AgentPassword', fallback='agent').encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)
        cursor.execute("insert into appusers(username, hashed_password) values(%s, %s)", (agent_user, hashed_password))
        print(f'agent user: created ({agent_user})')
      else:
        print(f'agent user: already exists ({agent_user})')

  print('Upgrade complete')

if __name__ == "__main__":
  dbname = sys.argv[1] if len(sys.argv) > 1 else config.get('Database', 'DatabaseName', fallback='protostar')
  upgrade_database(dbname)
