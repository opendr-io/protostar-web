import os
import json
import math
import logging
import pathlib
import configparser
import pandas as pd
from flask import jsonify
from llmservice import LLMService
from py2neo import Graph, Node, Relationship

logger = logging.getLogger('telemetry')

ELEMENT_NAMES = [
  'Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen',
  'Fluorine', 'Neon', 'Sodium', 'Magnesium', 'Aluminum', 'Silicon', 'Phosphorus', 'Sulfur',
  'Chlorine', 'Argon', 'Potassium', 'Calcium', 'Scandium', 'Titanium', 'Vanadium', 'Chromium',
  'Manganese', 'Iron', 'Cobalt', 'Nickel', 'Copper', 'Zinc', 'Gallium', 'Germanium',
  'Arsenic', 'Selenium', 'Bromine', 'Krypton', 'Rubidium', 'Strontium', 'Yttrium', 'Zirconium',
  'Niobium', 'Molybdenum', 'Technetium', 'Ruthenium', 'Rhodium', 'Palladium', 'Silver', 'Cadmium',
  'Indium', 'Tin', 'Antimony', 'Tellurium', 'Iodine', 'Xenon', 'Cesium', 'Barium',
  'Lanthanum', 'Cerium', 'Praseodymium', 'Neodymium', 'Promethium', 'Samarium', 'Europium', 'Gadolinium',
  'Terbium', 'Dysprosium', 'Holmium', 'Erbium', 'Thulium', 'Ytterbium', 'Lutetium', 'Hafnium',
  'Tantalum', 'Tungsten', 'Rhenium', 'Osmium', 'Iridium', 'Platinum', 'Gold', 'Mercury',
  'Thallium', 'Lead', 'Bismuth', 'Polonium', 'Astatine', 'Radon', 'Francium', 'Radium',
  'Actinium', 'Thorium', 'Protactinium', 'Uranium', 'Neptunium', 'Plutonium', 'Americium', 'Curium',
  'Berkelium', 'Californium', 'Einsteinium', 'Fermium', 'Mendelevium', 'Nobelium', 'Lawrencium', 'Rutherfordium',
  'Dubnium', 'Seaborgium', 'Bohrium', 'Hassium', 'Meitnerium', 'Darmstadtium', 'Roentgenium', 'Copernicium',
  'Nihonium', 'Flerovium', 'Moscovium', 'Livermorium', 'Tennessine', 'Oganesson'
]

class TelemetryService:
  def __init__(self):
    self.config = configparser.ConfigParser()
    self.config.read(pathlib.Path(__file__).parent.absolute() / "../dbconfig.ini")
    self.neo4j_driver = Graph(self.config.get('Neo4j', 'BoltURL', fallback='bolt://localhost:7687'),
      auth=(self.config.get('Neo4j', 'UserName', fallback='neo4j'), self.config.get('Neo4j', 'Password')))

  def check_connection(self):
    try:
      return self.neo4j_driver.run('RETURN 1 AS ok').evaluate() == 1
    except Exception as exc:
      logger.warning('Neo4j connection check failed: %s', exc)
      return False
  
  def form_graph_relationships(self, data):
    try:
      print('testing')
      graphData = {
        "nodes": [],
        "relationships": []
      }
      for record in data:
        relationship = record["r"]
        rel_type = relationship.type
        rel_props = relationship.properties
    except Exception as e:
      print(e)
  
  def get_view1(self):
    try:
      with(self.neo4j_driver.session()) as session:
        result = session.run("""MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n
        MATCH path = (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(:ALERT)
        RETURN path""")
        data = result.data()
        # print(data.pop().pop())
        self.form_graph_relationships(data)
        d = pd.DataFrame.from_dict(data).to_json()
        return d
    except Exception as e:
      print(e)
    return []

  def get_entities_neo(self):
    data = []
    try:
      neo4j = self.neo4j_driver
      result_df = neo4j.query(f"""
        MATCH (n:ENTITY)
          WHERE n.view = 2
          MATCH (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(m:ALERT)
        RETURN DISTINCT
          substring(n.entity, apoc.text.indexOf(n.entity, '-') + 1) AS entity
        ORDER BY entity ASC
        """).to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
      return ''
    return data
  
  def get_entity_details_neo(self, entity):
    data = []
    try:
      neo4j = self.neo4j_driver
      result_df = neo4j.query(f"""
        MATCH (n:ENTITY)
          WHERE n.view = 2
          MATCH (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(m:ALERT)
          where n.entity contains '{entity}'
          RETURN
              m.detection_type AS detection_type,
              m.severity AS severity,
              m.mitre_tactic AS mitre_tactic,
              m.category AS category,
              m.username AS username
          ORDER BY detection_type ASC
        """).to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return data

  def get_detections_neo(self, detection_type):
    data = []
    try:
      neo4j = self.neo4j_driver
      query = f"""
      MATCH (n:ENTITY)
        WHERE n.view = 2
        MATCH (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(m:ALERT)
        where m.detection_type contains '{detection_type}'
      RETURN
        m.detection_type AS detection_type,
        m.severity AS severity,
        m.mitre_tactic AS mitre_tactic,
        m.category AS category,
        m.username AS username,
        m.executable AS executable,
        COUNT(*) AS count
        ORDER BY detection_type ASC, count ASC
      """
      result_df = neo4j.query(query).to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return data
  
  def get_raw_entity_details_neo(self, entity):
    data = []
    try:
      neo4j = self.neo4j_driver
      query = f"""
        MATCH (n:ENTITY)
          WHERE n.view = 2
          MATCH (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(m:ALERT)
          where n.entity contains '{entity}'
          RETURN
              substring(n.entity, apoc.text.indexOf(n.entity, '-') + 1) AS entity,
              m.detection_type AS detection_type,
              m.mitre_tactic AS mitre_tactic,
              m.name as name,
              m.timestamp as timestamp,
              m.severity as severity,
              m.entity_type AS entity_type,
              m.guid as guid,
              m.category AS category,
              m.username AS username,
              m.host_ip as host_ip,
              m.source_ip as source_ip,
              m.executable AS executable,
              m.syscall_name as syscall_name,
              m.process as process,
              m.proctitle as proctitle,
              m.dest_ip as dest_ip,
              m.dest_port as dest_port
          ORDER BY n.entity ASC
        """
      result_df = neo4j.query(query).to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return data

  def search_alerts_neo(self, term):
    try:
      neo4j = self.neo4j_driver
      safe = (term or '').lower().replace("'", "''")
      # empty box returns the 100 most recent alerts; a search term widens the window to 500
      limit = 500 if safe.strip() else 100
      query = f"""
        MATCH (n:ENTITY)
          WHERE n.view = 2
          MATCH (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(m:ALERT)
          WHERE toLower(n.entity) CONTAINS '{safe}'
             OR toLower(m.entity_type) CONTAINS '{safe}'
             OR toLower(m.name) CONTAINS '{safe}'
             OR toLower(toString(m.severity)) CONTAINS '{safe}'
          WITH m, head(collect(DISTINCT n)) AS n
          RETURN
              substring(n.entity, apoc.text.indexOf(n.entity, '-') + 1) AS entity,
              m.detection_type AS detection_type,
              m.mitre_tactic AS mitre_tactic,
              m.name as name,
              m.timestamp as timestamp,
              m.severity as severity,
              m.entity_type AS entity_type,
              m.guid as guid,
              m.category AS category,
              m.username AS username,
              m.host_ip as host_ip,
              m.source_ip as source_ip,
              m.executable AS executable,
              m.syscall_name as syscall_name,
              m.process as process,
              m.proctitle as proctitle,
              m.message as message,
              m.dest_ip as dest_ip,
              m.dest_port as dest_port,
              m.dst_geo as dst_geo
          ORDER BY m.timestamp DESC
          LIMIT {limit}
        """
      result_df = neo4j.query(query).to_data_frame()
      return result_df.to_json()
    except Exception:
      logger.exception('Neo4j alert search failed')
      raise

  def raw_atomic_weight(self, atomic_number, atomic_mass, signal_unique, signal_mass):
    non_signal_mass = max(atomic_mass - signal_mass, 0)
    return (((float(atomic_number) ** atomic_number) ** (1 + min(signal_unique, 3)))
      * ((1 + signal_mass) ** 0.75)
      * ((1 + non_signal_mass) ** 0.25))

  def compressed_atomic_weight(self, raw_weight, maximum_expected_weight):
    compressed = round(1 + 117 * math.log(1 + raw_weight) / math.log(1 + maximum_expected_weight))
    return max(1, min(118, compressed))

  def get_view2(self):
    data = []
    try:
      neo4j = self.neo4j_driver
      result_df = neo4j.query("""
        MATCH (n:ENTITY)-[r]->(m) WHERE n.view = 1
        AND m.view = 1 WITH n, collect(DISTINCT type(r))
        AS relTypes, collect(r) AS relationships, collect(m)
        AS relatedNodes, elementId(n) as elementId WHERE size(relTypes) >= 2
        OPTIONAL MATCH (n2:ENTITY {view: 2, entity: n.entity})-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(a:ALERT)
        WITH n, relTypes, relationships, relatedNodes, elementId,
        count(DISTINCT a.detection_type) AS atomicNumber,
        count(a) AS atomicMass,
        count(DISTINCT CASE WHEN toLower(a.detection_type) CONTAINS 'signal' THEN a.detection_type END) AS signalUnique,
        count(CASE WHEN toLower(a.detection_type) CONTAINS 'signal' THEN a END) AS signalMass
        UNWIND relationships AS rel
        UNWIND relatedNodes AS relatedNode
        RETURN n{.*, atomic_number: atomicNumber, atomic_mass: atomicMass,
        signal_unique: signalUnique, signal_mass: signalMass} AS n,
        rel, relatedNode, relTypes, elementId
        """).to_data_frame()
      raw_weights = {}
      for node in result_df['n']:
        if node['entity'] not in raw_weights:
          raw_weights[node['entity']] = self.raw_atomic_weight(node['atomic_number'],
            node['atomic_mass'], node['signal_unique'], node['signal_mass'])
      # maximum expected weight is dynamic: the highest raw weight in the dataset maps to element 118
      maximum_expected_weight = max(raw_weights.values())
      for node in result_df['n']:
        compressed = self.compressed_atomic_weight(raw_weights[node['entity']], maximum_expected_weight)
        node['atomic_weight'] = f"{ELEMENT_NAMES[compressed - 1]} ({compressed})"
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return data
  
  def get_view6(self):
    data = []
    try:
      neo4j = self.neo4j_driver
      result_df = neo4j.query("""MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n
      MATCH path = (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(a:ALERT) where
      not n.entity = "172.16.200.110"
      and (a.detection_type = "CLOUD_ANOMALY"
      or a.detection_type = "CLOUD_ALERT") RETURN path""").to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return jsonify(data)
  
  def get_view7(self):
    data = []
    try:
      neo4j = self.neo4j_driver
      result_df = neo4j.query("""MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n
      MATCH path = (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(a:ALERT)
      where not n.entity = "172.16.200.110"
      and not (a.detection_type = "CLOUD_ANOMALY" 
      or a.detection_type = "CLOUD_ALERT") RETURN path""").to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return data

  def get_entity_types(self):
    data = {}
    try:
      result_df = self.neo4j_driver.query("""MATCH (n:ENTITY)
      MATCH (n)-[:HAS_SEVERITY|NAME_CLUSTER|INCLUDES*..3]->(m:ALERT)
      RETURN n.entity AS entity, collect(DISTINCT m.entity_type)[0] AS entity_type""").to_data_frame()
      data = jsonify(dict(zip(result_df['entity'], result_df['entity_type'])))
    except Exception as e:
      print(e)
    return data

  def get_all_entities(self):
    data = []
    try:
      result_df = self.neo4j_driver.query("""MATCH (n:ENTITY)
      RETURN collect(DISTINCT n.entity) AS entities""").to_data_frame()
      data = jsonify(result_df.iloc[0,0])
    except Exception as e:
      print(e)
    return data

  def form_data(self, result):
    nodes = {}
    links = []
    for record in result:
      # print(record)
      # Process both source and target nodes
      for key in ['p']:
        # print(record)
        node = record[key]
        # print(node)
        node_id = node('start')
        # print(node_id)
        if node_id not in nodes:
          nodes[node_id] = {
            "id": node_id,
            "labels": list(node.labels),
            "properties": dict(node)
          }
      # Process the relationship details
      rel = record['r']
      links.append(
      {
        "id": rel.id,
        "source": rel.start_node.id,
        "target": rel.end_node.id,
        "type": rel.type,
        "properties": dict(rel)
      })
      return {"nodes": list(nodes.values()), "links": links}
