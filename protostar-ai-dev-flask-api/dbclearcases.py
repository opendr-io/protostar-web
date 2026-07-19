import sys
import psycopg
import configparser
from pathlib import Path

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "dbconfig.ini")

def clear_all_cases(dbname):
  with psycopg.connect(host=config.get('Database', 'HostName'), port=config.get('Database', 'PortNumber', fallback='5432'), dbname=dbname,
  user=config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=config.get('Database', 'RootDatabasePassword'), autocommit=True) as connection:
    with connection.cursor() as cursor:
      cursor.execute('select count(*) from cases')
      case_count = cursor.fetchone()[0]
      cursor.execute('select count(*) from case_comments')
      comment_count = cursor.fetchone()[0]
      cursor.execute('TRUNCATE case_comments, cases RESTART IDENTITY')
      print(f'Deleted {case_count} case(s) and {comment_count} comment(s) from {dbname}; case ids restart at 1')

if __name__ == "__main__":
  dbname = sys.argv[1] if len(sys.argv) > 1 else config.get('Database', 'DatabaseName', fallback='protostar')
  clear_all_cases(dbname)
