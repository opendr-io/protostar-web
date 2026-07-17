import json
import logging
import threading
import psycopg
import configparser
from pathlib import Path

logger = logging.getLogger('agent')

class AppService:
  def __init__(self):
    self.config = configparser.ConfigParser()
    self.config.read(Path(__file__).parent.absolute() / "../dbconfig.ini")
    self.aicommenting = False

  def check_connection(self):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword'), connect_timeout=3) as connection:
        with connection.cursor() as cursor:
          cursor.execute('select 1')
          return cursor.fetchone()[0] == 1
    except Exception as exc:
      logger.warning('PostgreSQL connection check failed: %s', exc)
      return False

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
          sqlInsertStatement = f"insert into cases(assigned_user, casename, description, priority, investigated_entity, properties, created_at, resolved_at) values({fillers}) RETURNING case_id"
          final_params = [assigned_user, case_name, case_description, priority, investigated_entity, None, None]
          cursor.execute(sqlInsertStatement, final_params)
          return cursor.fetchone()[0]
    except Exception as exc:
      logger.error(exc)
      return "Something went wrong"

  def set_agent_status(self, case, status):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute("update cases set properties = coalesce(properties, '{}'::jsonb) || jsonb_build_object('agent_status', %s::text) where case_id = %s", (status, case))
    except Exception as exc:
      logger.error(exc)

  def close_case(self, case):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute('update cases set resolved_at = CURRENT_TIMESTAMP where case_id = %s and resolved_at is null', (case,))
          logger.info(f'case {case}: closed')
          return True
    except Exception as exc:
      logger.error(exc)
      return False

  def get_entities_with_cases(self):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute('select distinct investigated_entity from cases')
          return {row[0] for row in cursor.fetchall()}
    except Exception as exc:
      logger.error(exc)
      return set()

  def get_unprocessed_cases(self):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute("""select case_id, investigated_entity from cases
            where case_id not in (select distinct case_id from case_comments where comment_user = 'agent' and comment <> '')
            and properties->>'agent_status' is distinct from 'queued'
            and resolved_at is null
            order by case_id""")
          return cursor.fetchall()
    except Exception as exc:
      logger.error(exc)
      return []

  def backfill_agent_comments(self, telemetryservice, promptservice, llmservice):
    cases = self.get_unprocessed_cases()
    if not cases:
      logger.info('backfill: all cases already have agent comments')
      return 0
    for (case_id, entity) in cases:
      self.set_agent_status(case_id, 'queued')
    logger.info(f'backfill: queued {len(cases)} case(s) without agent comments')
    thread = threading.Thread(target=self.__backfill_worker, args=(cases, telemetryservice, promptservice, llmservice))
    thread.daemon = True
    thread.start()
    return len(cases)

  def __backfill_worker(self, cases, telemetryservice, promptservice, llmservice):
    for (case_id, entity) in cases:
      if not self.aicommenting:
        self.set_agent_status(case_id, None)
        logger.info(f'backfill case {case_id}: skipped, AI commenting was turned off mid-backfill')
        continue
      try:
        details = telemetryservice.get_raw_entity_details_neo(entity)
        prompt = promptservice.agent_case_comment_prompt(details)
        llmcomment = llmservice.ask_claude(prompt)
        if llmcomment and self.post_case_comment(case_id, 'agent', llmcomment):
          self.set_agent_status(case_id, 'processed')
          logger.info(f'backfill case {case_id}: comment posted ({len(llmcomment)} chars)')
        else:
          self.set_agent_status(case_id, 'failed')
          logger.warning(f'backfill case {case_id}: no comment posted (LLM empty or insert failed)')
      except Exception as exc:
        self.set_agent_status(case_id, 'failed')
        logger.error(f'backfill case {case_id}: {exc}')
    logger.info('backfill: finished')

  def reset_stale_agent_statuses(self):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute("""update cases set properties = properties || '{"agent_status": "failed"}'::jsonb where properties->>'agent_status' = 'queued'""")
          if cursor.rowcount:
            logger.warning(f'marked {cursor.rowcount} case(s) stuck in queued as failed (server was stopped mid-generation)')
    except Exception as exc:
      logger.error(exc)

  def add_to_case_queue(self, case_id, initial_prompt, llmservice):
    self.set_agent_status(case_id, 'queued')
    logger.info(f'case {case_id}: comment queued')
    thread = threading.Thread(target=self.__process_case, args=([case_id, initial_prompt, llmservice],))
    thread.daemon = True
    thread.start()

  def __process_case(self, caseinfo):
    case_id = caseinfo[0]
    prompt = caseinfo[1]
    llmservice = caseinfo[2]
    llmcomment = llmservice.ask_claude(prompt)
    if llmcomment and self.post_case_comment(case_id, 'agent', llmcomment):
      self.set_agent_status(case_id, 'processed')
      logger.info(f'case {case_id}: comment posted ({len(llmcomment)} chars)')
    else:
      self.set_agent_status(case_id, 'failed')
      logger.warning(f'case {case_id}: no comment posted (LLM empty or insert failed)')

  def get_case(self, case):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute('select row_to_json(t) from cases as t where t.case_id = %s', (case,))
          row = cursor.fetchone()
          return row[0] if row else None
    except Exception as exc:
      logger.error(exc)

  def get_all_cases(self):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute('select row_to_json(t) from cases as t order by t.created_at desc')
          cases = cursor.fetchall()
          json_cases = json.dumps(cases)
          return json_cases
    except Exception as exc:
      logger.error(exc)

  def post_case_comment(self, case, user, comment):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          fillers ="%s,%s,%s,Default"
          sqlInsertStatement = f"insert into case_comments (case_id, comment_user, comment, created_at) values({fillers})"
          final_params = [case, user, comment]
          cursor.execute(sqlInsertStatement, final_params)
          return True
    except Exception as exc:
      logger.error(exc)
      return False

  def save_alert_explanation(self, guid, entity, explanation):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute("""insert into alert_explanations (guid, entity, explanation) values (%s, %s, %s)
            on conflict (guid) do update set explanation = excluded.explanation, created_at = CURRENT_TIMESTAMP""", (guid, entity, explanation))
          return True
    except Exception as exc:
      logger.error(exc)
      return False

  def get_alert_explanations(self, guids):
    if not guids:
      return json.dumps({})
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute('select guid, explanation from alert_explanations where guid = ANY(%s)', (list(guids),))
          return json.dumps({row[0]: row[1] for row in cursor.fetchall()})
    except Exception as exc:
      logger.error(exc)
      return json.dumps({})

  def load_case_comments(self, case):
    try:
      with psycopg.connect(host=self.config.get('Database', 'HostName'), port=self.config.get('Database', 'PortNumber', fallback='4000'), dbname=self.config.get('Database', 'DatabaseName', fallback='protostar'),
      user=self.config.get('Database', 'RootDatabaseUserName', fallback='postgres'), password=self.config.get('Database', 'RootDatabasePassword')) as connection:
        with connection.cursor() as cursor:
          cursor.execute('SELECT row_to_json(row(comment_user, comment, created_at)) FROM case_comments where case_id = %s ORDER BY created_at DESC', (case,))
          comments = cursor.fetchall()
          json_comments = json.dumps(comments)
          return json_comments
    except Exception as exc:
      logger.error(exc)
