import sys
import socket
import logging
from logging.handlers import RotatingFileHandler
from collections import deque
import secrets
from OpenSSL import SSL
from datetime import timedelta
from pathlib import Path
import configparser
from flask import Flask, request, make_response, jsonify
from flask_cors import CORS, cross_origin
from flask_jwt_extended import (JWTManager, jwt_required, get_jwt_identity)
from flask_talisman import Talisman
sys.path.append('services')
from llmservice import LLMService
from telemetryservice import TelemetryService
from authservice import AuthService
from appservice import AppService
from promptservice import PromptService

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "appconfig.ini")

logdir = Path(__file__).parent.absolute() / "logs"
logdir.mkdir(exist_ok=True)
filehandler = RotatingFileHandler(logdir / "api.log", maxBytes=5 * 1024 * 1024, backupCount=3, encoding='utf-8')
filehandler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s'))
logging.getLogger().addHandler(filehandler)
logging.getLogger().setLevel(logging.INFO)

app = Flask(__name__)
app.config["JWT_ALGORITHM"] = "HS512"
app.config['JWT_SECRET_KEY'] = secrets.token_hex(32)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=2)
app.config['JWT_ERROR_MESSAGE_KEY'] = 'message'

csp = {
  'default-src': "'self'",
  'script-src': "'none'",
  'style-src': "'self'",
  'img-src': "'self'",
}

talisman = Talisman(app, force_https=False)
jwt = JWTManager(app)

llmservice = LLMService()
telemetryservice = TelemetryService()
authservice = AuthService()
appservice = AppService()
promptservice = PromptService()
appservice.reset_stale_agent_statuses()

@app.route('/login', methods=['POST'])
@cross_origin()
def login():
  data = request.get_json()
  return authservice.login(data)

@app.route('/renew', methods=['POST'])
@jwt_required(refresh=True)
@cross_origin()
def renew_token():
  current_user = get_jwt_identity()
  return authservice.renew_token(current_user)

@app.route('/logout', methods=['POST'])
@jwt_required()
@cross_origin()
def logout():
  data = request.get_json()
  return authservice.logout(data)

@app.route('/register', methods=['POST'])
@jwt_required()
@cross_origin()
def register():
  data = request.get_json()
  return authservice.register(data)

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
  print('expired')
  return (jsonify({
      'message': 'Token has expired',
      'error': 'token_expired'
  }), 401)

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
  # consulted by jwt_required on every request; blocklist holds jti of logged-out tokens.
  # in-memory is sufficient because the JWT secret rotates on restart, so any token from a
  # previous process is already invalid and never reaches this check.
  return jwt_payload['jti'] in authservice.BLOCKLIST

@app.route('/askllm', methods=['POST'])
@jwt_required()
@cross_origin()
def ask_llm():
  try:
    data = request.get_json()
    question = data.get('question')
    answer = llmservice.ask_claude(question)
    return answer
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/asklocalllm', methods=['POST'])
@jwt_required()
@cross_origin()
def ask_local_llm():
  data = request.get_json()
  question = data.get('question')
  answer = llmservice.ask_local_llm(question)
  return answer

@app.route('/setlocallmuse', methods=['POST'])
@jwt_required()
@cross_origin()
def set_local_llm_use():
  data = request.get_json()
  uselocalllm = data.get('uselocalllm')
  llmservice.set_use_local_llm(uselocalllm)

@app.route('/caniuselocalllm', methods=['GET'])
@jwt_required()
@cross_origin()
def can_i_use_local_llm():
  return llmservice.use_local_llm()

@app.route('/retrievesummary', methods=['GET'])
@jwt_required()
@cross_origin()
def retrieve_summary():
  print('testing retrieve_summary()')
  summary = telemetryservice.get_summary()
  return summary

@app.route('/getrawalerts', methods=['GET'])
@jwt_required()
@cross_origin()
def get_raw_alerts():
  raw = telemetryservice.get_raw_alerts()
  return raw

@app.route('/getentities', methods=['GET'])
@jwt_required()
@cross_origin()
def get_entities():
  entities = telemetryservice.get_entities()
  return entities

@app.route('/getentitiesneo', methods=['GET'])
@jwt_required()
@cross_origin()
def get_entities_neo():
  entities = telemetryservice.get_entities_neo()
  return entities

@app.route('/entitydetails', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_entity_details():
  data = request.get_json()
  entity = data.get('entity')
  details = telemetryservice.get_entity_details(entity)
  return details

@app.route('/entitydetailsv2', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_entity_details_v2():
  data = request.get_json()
  entity = data.get('entity')
  details = telemetryservice.get_entity_details_neo(entity)
  return details

@app.route('/rawentitydetails', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_raw_entity_details():
  data = request.get_json()
  entity = data.get('entity')
  details = telemetryservice.get_raw_entity_details(entity)
  return details

@app.route('/entitydetailsneo', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_entity_details_neo():
  data = request.get_json()
  entity = data.get('entity')
  details = telemetryservice.get_entity_details_neo(entity)
  return details

@app.route('/rawentitydetailsneo', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_raw_entity_details_neo():
  data = request.get_json()
  entity = data.get('entity')
  details = telemetryservice.get_raw_entity_details_neo(entity)
  return details

@app.route('/retrievecolumnnames', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_column_names():
  d = request.get_json().get('type')
  return telemetryservice.get_columns(d)

@app.route('/showgraph', methods=['POST'])
@jwt_required()
@cross_origin()
def display_graph_view():
  data = request.get_json()
  view = data.get('view')
  details = []
  match(view):
    case "view1":
      details = telemetryservice.get_view1()
    case "view2":
      details = telemetryservice.get_view2()
    case "view3":
      pass
    case "view4":
      pass
    case "view5":
      pass
    case "view6":
      details = telemetryservice.get_view6()
    case "view7":
      details = telemetryservice.get_view7()
  return details

@app.route('/apilog', methods=['GET'])
@jwt_required()
@cross_origin()
def get_api_log():
  try:
    requested_lines = request.args.get('lines', default=500, type=int)
    line_limit = min(max(requested_lines or 500, 1), 2000)
    log_file = logdir / 'api.log'
    if not log_file.exists():
      return jsonify({'lines': [], 'line_count': 0})
    with log_file.open('r', encoding='utf-8', errors='replace') as stream:
      lines = [line.rstrip('\r\n') for line in deque(stream, maxlen=line_limit)]
    return jsonify({'lines': lines, 'line_count': len(lines)})
  except Exception:
    logging.getLogger(__name__).exception('Unable to read API log')
    return make_response(jsonify({'error': 'Unable to read API log'}), 500)

@app.route('/corazalog', methods=['GET'])
@jwt_required()
@cross_origin()
def get_coraza_log():
  # the Coraza WAF audit log lives in the proxy folder; only populated when the
  # app is run behind the reverse proxy. Returns empty if absent (e.g. direct dev).
  try:
    requested_lines = request.args.get('lines', default=500, type=int)
    line_limit = min(max(requested_lines or 500, 1), 2000)
    log_file = Path(__file__).parent.parent.absolute() / 'protostar-proxy' / 'coraza-audit.log'
    if not log_file.exists():
      return jsonify({'lines': [], 'line_count': 0})
    with log_file.open('r', encoding='utf-8', errors='replace') as stream:
      lines = [line.rstrip('\r\n') for line in deque(stream, maxlen=line_limit)]
    return jsonify({'lines': lines, 'line_count': len(lines)})
  except Exception:
    logging.getLogger(__name__).exception('Unable to read Coraza audit log')
    return make_response(jsonify({'error': 'Unable to read WAF audit log'}), 500)

def check_proxy():
  # the reverse proxy (Caddy) listens on :8443; a TCP connect confirms it's up.
  try:
    with socket.create_connection(('127.0.0.1', 8443), timeout=1):
      return True
  except OSError:
    return False

@app.route('/connectionstatus', methods=['GET'])
@jwt_required()
@cross_origin()
def get_connection_status():
  return jsonify({
    'flask': True,
    'neo4j': telemetryservice.check_connection(),
    'postgresql': appservice.check_connection(),
    'proxy': check_proxy()
  })

@app.route('/getusers', methods=['POST'])
@jwt_required()
@cross_origin()
def get_users():
  try:
    users = appservice.get_users()
    return users
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getallentities', methods=['POST'])
@jwt_required()
@cross_origin()
def get_all_entiies():
  try:
    users = telemetryservice.get_all_entities()
    return users
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/createcase', methods=['POST'])
@jwt_required()
@cross_origin()
def create_case():
  try:
    data = request.get_json()
    assigned_user = data.get('username')
    investigated_entity = data.get('entity')
    case_name = data.get('casename')
    case_description = data.get('description')
    case_priority = data.get('priority')
    if investigated_entity in appservice.get_entities_with_cases():
      return make_response(jsonify({"Exists": investigated_entity}), 200)
    created_case = appservice.create_case(investigated_entity, assigned_user, case_name, case_description, case_priority)
    if appservice.aicommenting:
      details = telemetryservice.get_raw_entity_details_neo(investigated_entity)
      prompt = promptservice.agent_case_comment_prompt(details)
      appservice.add_to_case_queue(created_case, prompt, llmservice)
    return make_response(jsonify({"Success": created_case}), 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/postcasecomment', methods=['POST'])
@jwt_required()
@cross_origin()
def post_case_comment():
  try:
    data = request.get_json()
    user = data.get('user')
    comment = data.get('comment')
    case = data.get('case')
    status = appservice.post_case_comment(case, user, comment)
    if appservice.aicommenting and comment and comment.strip().lower().startswith('@agent'):
      question = comment.strip()[len('@agent'):].strip()
      if not question:
        question = 'Provide your current assessment of this case.'
      case_details = appservice.get_case(case)
      if case_details:
        telemetry = telemetryservice.get_raw_entity_details_neo(case_details.get('investigated_entity'))
        thread = appservice.load_case_comments(case)
        prompt = promptservice.agent_case_question_prompt(question, case_details, thread, telemetry)
        appservice.add_to_case_queue(case, prompt, llmservice)
    return make_response(jsonify({"Success": "Submitted"}), 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/loadcasecomments', methods=['POST'])
@jwt_required()
@cross_origin()
def load_case_comments():
  try:
    data = request.get_json()
    case = data.get('case')
    comments = appservice.load_case_comments(case)
    return make_response(comments, 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/closecase', methods=['POST'])
@jwt_required()
@cross_origin()
def close_case():
  try:
    data = request.get_json()
    case = data.get('case')
    status = appservice.close_case(case)
    return make_response(jsonify({"Success": status}), 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getentitytypes', methods=['POST'])
@jwt_required()
@cross_origin()
def get_entity_types():
  try:
    types = telemetryservice.get_entity_types()
    return types
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/createcasesforallentities', methods=['POST'])
@jwt_required()
@cross_origin()
def create_cases_for_all_entities():
  try:
    data = request.get_json()
    assigned_user = data.get('username')
    response = telemetryservice.get_all_entities()
    entities = response.get_json() if hasattr(response, 'get_json') else []
    existing = appservice.get_entities_with_cases()
    created = 0
    for entity in entities:
      if entity not in existing:
        appservice.create_case(entity, assigned_user, entity, '', 0)
        created += 1
    queued = 0
    if appservice.aicommenting and created:
      queued = appservice.backfill_agent_comments(telemetryservice, promptservice, llmservice)
    return make_response(jsonify({"created": created, "queued": queued}), 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/setaicommenting', methods=['POST'])
@jwt_required()
@cross_origin()
def set_ai_commenting():
  try:
    data = request.get_json()
    appservice.aicommenting = bool(data.get('enabled'))
    queued = 0
    if appservice.aicommenting:
      queued = appservice.backfill_agent_comments(telemetryservice, promptservice, llmservice)
    return make_response(jsonify({"aicommenting": appservice.aicommenting, "queued": queued}), 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getaicommenting', methods=['POST'])
@jwt_required()
@cross_origin()
def get_ai_commenting():
  try:
    return make_response(jsonify({"aicommenting": appservice.aicommenting}), 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/searchalerts', methods=['POST'])
@jwt_required()
@cross_origin()
def search_alerts():
  data = request.get_json() or {}
  term = data.get('term')
  return telemetryservice.search_alerts_neo(term)

@app.route('/savealertexplanation', methods=['POST'])
@jwt_required()
@cross_origin()
def save_alert_explanation():
  try:
    data = request.get_json()
    guid = data.get('guid')
    entity = data.get('entity')
    explanation = data.get('explanation')
    if not guid or not explanation:
      return make_response(jsonify({"error": "guid and explanation are required"}), 400)
    saved = appservice.save_alert_explanation(guid, entity, explanation)
    return make_response(jsonify({"Success": saved}), 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getalertexplanations', methods=['POST'])
@jwt_required()
@cross_origin()
def get_alert_explanations():
  try:
    data = request.get_json()
    guids = data.get('guids')
    explanations = appservice.get_alert_explanations(guids)
    return make_response(explanations, 200)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getallcases', methods=['POST'])
@jwt_required()
@cross_origin()
def get_all_cases():
  try:
    cases = appservice.get_all_cases()
    return cases
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

if __name__ == "__main__":
  app.run(host='0.0.0.0', port=5002)
