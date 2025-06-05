import psycopg
from pathlib import Path

def setup_postgres_tables():
  print('Initiating Database Connection')
  with psycopg.connect() as connection:
    print('Connection Made!')
    with connection.cursor() as cursor:
      print('Creating PostgreSQL Database')
      cursor.execute("CREATE DATABASE skynet")
      print('Database Created!')
    connection.commit()

  with psycopg.connect() as connection:
    with connection.cursor() as cursor:
      print('Creating PostgreSQL Tables and Users')
      print('Users Created!')
      cursor.execute("""CREATE TABLE appusers (id serial PRIMARY KEY, username text, hashed_password BYTEA)""")
      cursor.execute("""CREATE TABLE expired_tokens (id serial PRIMARY KEY, token text)""")
      print('Tables Created!')
      cursor.execute("CREATE USER application WITH PASSWORD 'Agent!123'")
      cursor.execute("CREATE USER appuser WITH PASSWORD 'user!123'")
      cursor.execute("GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO application")
      cursor.execute("GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO appuser")
      cursor.execute("GRANT INSERT ON ALL TABLES IN SCHEMA public TO application")
      cursor.execute("GRANT SELECT ON ALL TABLES IN SCHEMA public TO appuser")
    connection.commit()

setup_postgres_tables()