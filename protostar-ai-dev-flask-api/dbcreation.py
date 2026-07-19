import psycopg
import bcrypt
import configparser
from pathlib import Path

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "dbconfig.ini")

def setup_postgres_tables():
  print('Initiating Database Connection')
  try:
    with psycopg.connect(host=config.get('Database', 'HostName'), port=config.get('Database', 'PortNumber', fallback='5432'),
    user=config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=config.get('Database', 'RootDatabasePassword'), autocommit=True) as connection:
      print('Connection Made!')
      with connection.cursor() as cursor:
        print('Creating PostgreSQL Database')
        cursor.execute(f"CREATE DATABASE {config.get('Database', 'DatabaseName', fallback='protostar')}")
        print('Database Created!')
      connection.commit()
  except Exception:
    print('Database has already been created')

  with psycopg.connect(host=config.get('Database', 'HostName'), port=config.get('Database', 'PortNumber', fallback='5432'), dbname=config.get('Database', 'DatabaseName', fallback='protostar'),
  user=config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=config.get('Database', 'RootDatabasePassword')) as connection:
    with connection.cursor() as cursor:
      print('Creating PostgreSQL Tables and Users')
      try:
        cursor.execute("""CREATE TABLE appusers (id serial PRIMARY KEY, username text UNIQUE NOT NULL, hashed_password BYTEA)""")
      except Exception:
        connection.rollback()
        print('Table appusers has already been created')
      try:
        cursor.execute("""CREATE TABLE expired_tokens (id serial PRIMARY KEY, token text)""")
      except Exception:
        connection.rollback()
        print('Table expired_tokens has already been created')
      try:
        cursor.execute("""CREATE TABLE cases (
          case_id serial PRIMARY KEY,
          assigned_user TEXT REFERENCES appusers(username),
          casename TEXT NOT NULL, description TEXT,
          priority INTEGER NOT NULL DEFAULT 0,
          investigated_entity TEXT NOT NULL UNIQUE,
          properties JSONB, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP)""")
        connection.commit()
      except Exception:
        connection.rollback()
        print('Table cases has already been created')
      try:
        cursor.execute("""CREATE TABLE case_comments (
          comment_id SERIAL PRIMARY KEY,
          case_id INTEGER REFERENCES cases(case_id),
          comment_user TEXT REFERENCES appusers(username),
          comment TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);""")
        connection.commit()
      except Exception:
        connection.rollback()
        print('Table case_comments has already been created')
      try:
        cursor.execute("""CREATE TABLE alert_explanations (
          explanation_id SERIAL PRIMARY KEY,
          guid TEXT NOT NULL UNIQUE,
          entity TEXT NOT NULL,
          explanation TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);""")
        connection.commit()
      except Exception:
        connection.rollback()
        print('Table alert_explanations has already been created')
      finally:
        print('Tables Created!')
      try:
        password = config.get('Database', 'ApplicationUserPassword', fallback='appuser').encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)
        fillers = ("%s," * 2)[:-1]
        sqlInsertStatement = f"insert into appusers(username, hashed_password) values({fillers}) ON CONFLICT (username) DO NOTHING"
        final_params = [config.get('Database', 'ApplicationUser', fallback='appuser'), hashed_password]
        cursor.execute(sqlInsertStatement, final_params)

        password = config.get('Database', 'AgentPassword', fallback='agent').encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)
        final_params = [config.get('Database', 'AgentUser', fallback='agent'), hashed_password]
        cursor.execute(sqlInsertStatement, final_params)
        connection.commit()
        print('Users Created!')
      except:
        connection.rollback()
        print('Users have already been created!')

setup_postgres_tables()