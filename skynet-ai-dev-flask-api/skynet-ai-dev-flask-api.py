import sys
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

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "appconfig.ini")

app = Flask(__name__)
app.config["JWT_ALGORITHM"] = "HS512"
app.config['JWT_SECRET_KEY'] = secrets.token_hex(32)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=4)
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

@app.route('/askllm', methods=['POST'])
@jwt_required()
@cross_origin()
def ask_llm():
  try:
    data = request.get_json()
    question = data.get('question')
    answer = llmservice.ask_local_llm(question)
    return answer
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/asklocalllm', methods=['POST'])
@jwt_required()
@cross_origin()
def ask_local_llm():
  try:
    data = request.get_json()
    question = data.get('question')
    answer = llmservice.ask_local_llm(question)
    return answer
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/setlocallmuse', methods=['POST'])
@jwt_required()
@cross_origin()
def set_local_llm_use():
  try:
    data = request.get_json()
    uselocalllm = data.get('uselocalllm')
    llmservice.set_use_local_llm(uselocalllm)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

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
  try:
    summary = telemetryservice.get_summary()
    return summary
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getrawalerts', methods=['GET'])
@jwt_required()
@cross_origin()
def get_raw_alerts():
  try:
    raw = telemetryservice.get_raw_alerts()
    return raw
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getentities', methods=['GET'])
@jwt_required()
@cross_origin()
def get_entities():
  try:
    entities = telemetryservice.get_entities()
    return entities
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/getentitiesneo', methods=['GET'])
@jwt_required()
@cross_origin()
def get_entities_neo():
  try:
    entities = telemetryservice.get_entities_neo()
    return entities
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/entitydetails', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_entity_details():
  try:
    data = request.get_json()
    entity = data.get('entity')
    details = telemetryservice.get_entity_details(entity)
    return details
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/entitydetailsv2', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_entity_details_v2():
  try:
    data = request.get_json()
    entity = data.get('entity')
    details = telemetryservice.get_entity_details_neo(entity)
    return details
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/rawentitydetails', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_raw_entity_details():
  try:
    data = request.get_json()
    entity = data.get('entity')
    details = telemetryservice.get_raw_entity_details(entity)
    return details
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/entitydetailsneo', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_entity_details_neo():
  try:
    data = request.get_json()
    entity = data.get('entity')
    details = telemetryservice.get_entity_details_neo(entity)
    return details
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/rawentitydetailsneo', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_raw_entity_details_neo():
  try:
    data = request.get_json()
    entity = data.get('entity')
    details = telemetryservice.get_raw_entity_details_neo(entity)
    return details
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/retrievecolumnnames', methods=['POST'])
@jwt_required()
@cross_origin()
def retrieve_column_names():
  try:
    d = request.get_json().get('type')
    return telemetryservice.get_columns(d)
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

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
    status = appservice.create_case(investigated_entity, assigned_user, case_name, case_description, case_priority)
    return status
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
    print(user)
    print(comment)
    # status = appservice.post_case_comment(investigated_entity, assigned_user, case_name, case_description, case_priority)
    return "status"
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

@app.route('/caseinvestigation', methods=['POST'])
@jwt_required
@cross_origin
def case_investigation():
  try:
    response = ''
    data = request.get_json()
    model = data.get('model')
    conversation = data.get('conversation')
    match(model):
      case "claude":
        response = llmservice.case_investigation(conversation, 'claude', case)
      case "chatgpt":
        response = llmservice.case_investigation(conversation, 'chatgpt', case)
      case "lmstudio":
        response = llmservice.case_investigation(conversation, 'lmstudio', case)
    return response
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

@app.route('/showgraph', methods=['POST'])
@jwt_required()
@cross_origin()
def display_graph_view():
  try:
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
  except Exception as e:
    response = make_response(jsonify({"error": "Something went wrong"}), 401)
    return response

if __name__ == "__main__":
  app.run(debug=True, host='0.0.0.0', port=5002)