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
        cursor.execute("""CREATE TABLE appusers (id serial PRIMARY KEY, username text, hashed_password BYTEA)""")
      except Exception:
        print('Table appusers has already been created')
      try:
        cursor.execute("""CREATE TABLE expired_tokens (id serial PRIMARY KEY, token text)""")
      except Exception:
        print('Table expired_tokens has already been created')
      finally:
        print('Tables Created!')
      try:
        password = config.get('Database', 'ApplicationUserPassword', fallback='appuser').encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)
        fillers = ("%s," * 2)[:-1]
        sqlInsertStatement = f"insert into appusers(username, hashed_password) values({fillers})"
        final_params = [config.get('Database', 'ApplicationUser', fallback='appuser'), hashed_password]
        cursor.execute(sqlInsertStatement, final_params)

        password = config.get('Database', 'ApplicationUserPassword2', fallback='appuser').encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)
        fillers = ("%s," * 2)[:-1]
        sqlInsertStatement = f"insert into appusers(username, hashed_password) values({fillers})"
        final_params = [config.get('Database', 'ApplicationUser2', fallback='appuser'), hashed_password]
        cursor.execute(sqlInsertStatement, final_params)

        password = config.get('Database', 'ApplicationUserPassword3', fallback='appuser').encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)
        fillers = ("%s," * 2)[:-1]
        sqlInsertStatement = f"insert into appusers(username, hashed_password) values({fillers})"
        final_params = [config.get('Database', 'ApplicationUser3', fallback='appuser'), hashed_password]
        cursor.execute(sqlInsertStatement, final_params) 

        password = config.get('Database', 'ApplicationUserPassword4', fallback='appuser').encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password, salt)
        fillers = ("%s," * 2)[:-1]
        sqlInsertStatement = f"insert into appusers(username, hashed_password) values({fillers})"
        final_params = [config.get('Database', 'ApplicationUser4', fallback='appuser'), hashed_password]
        cursor.execute(sqlInsertStatement, final_params)
        connection.commit()       
        print('Users Created!')
      except:
        print('Users have already been created!')

setup_postgres_tables()