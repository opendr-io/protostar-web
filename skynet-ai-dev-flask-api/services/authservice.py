import bcrypt
import psycopg
import pathlib
import configparser
import pandas as pd
from flask import jsonify
from flask_jwt_extended import (create_access_token, create_refresh_token)

class AuthService:
  def __init__(self):
    self.BLOCKLIST = set()
    self.config = configparser.ConfigParser()
    
    self.config.read(pathlib.Path(__file__).parent.absolute() / "../dbconfig.ini")

  def renew_token(self, current_user):
    new_access_token = create_access_token(identity=current_user)
    return jsonify(access_token=new_access_token), 200

  def login(self, data):
    with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='skynet'),
    user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
      with connection.cursor() as cursor:
        username = data.get('username')
        password = data.get('password').encode('utf-8')
        sqlStatement = f"select hashed_password from appusers where username='{username}'"
        cursor.execute(sqlStatement)
        exists = cursor.fetchone()
        if(exists):
          hash_pass = exists[0]
          if(bcrypt.checkpw(password, hash_pass)):
            access_token = create_access_token(identity=username)
            refresh_token = create_refresh_token(identity=username)
            return (jsonify({"access_token": access_token, "refresh_token": refresh_token}), 200)
    return (jsonify({"msg": "Incorrect username or password"}), 401)

  def register(self, data):
    salt = bcrypt.gensalt()
    with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='skynet'),
    user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
      with connection.cursor() as cursor:
        username = data.get('username')
        password = data.get('password').encode('utf-8')
        hashed_password = bcrypt.hashpw(password, salt)
        sqlStatement = f"select username from appusers where username='{username}'"
        cursor.execute(sqlStatement)
        exists = cursor.fetchone()
        if(exists is None):
          fillers = ("%s," * 2)[:-1]
          sqlInsertStatement = f"insert into appusers(username, hashed_password) values({fillers})"
          final_params = [username, hashed_password]
          cursor.execute(sqlInsertStatement, final_params)
          return jsonify('User Created!')
        else:
          return jsonify('User Exists')
    return jsonify('Testing')
  
  def logout(self, tokens):
    access = tokens.get('token')
    refresh = tokens.get('refresh')
    with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='skynet'),
    user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
      with connection.cursor() as cursor:
        fillers = ("%s," * 1)[:-1]
        sqlInsertStatement = f"insert into expired_tokens(token) values({fillers})"
        final_params = [access]
        cursor.execute(sqlInsertStatement, final_params)
        final_params = [refresh]
        cursor.execute(sqlInsertStatement, final_params)
        self.BLOCKLIST.add(access)
        self.BLOCKLIST.add(refresh)
        return (jsonify({"status": "You've been logged out"}), 200)
    return jsonify('Testing')