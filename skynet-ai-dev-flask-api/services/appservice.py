import json
from flask_jwt_extended import JWTManager
import psycopg
import bcrypt
import configparser
from pathlib import Path

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "dbconfig.ini")

class AppService:
  def __init__(self):
    self.config = configparser.ConfigParser()
    self.config.read(Path(__file__).parent.absolute() / "../dbconfig.ini")    

  def get_users(self):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute('select username from appusers')
          users = cursor.fetchall()
          json_user = json.dumps(users)
          return json_user
    except:
      return "Something went wrong"
      
  def create_case(self, investigated_entity, assigned_user, case_name, case_description, priority=0):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          fillers ="%s,%s,%s,%s,%s,%s,Default,%s"
          # fillers = ("%s," * 8)[:-1]
          sqlInsertStatement = f"insert into cases(assigned_user, casename, description, priority, investigated_entity, properties, created_at, resolved_at) values({fillers})"
          final_params = [assigned_user, case_name, case_description, priority, investigated_entity, None, None]
          cursor.execute(sqlInsertStatement, final_params)
          return "Success"
    except Exception as exc:
      print(exc)
      return "Something went wrong"