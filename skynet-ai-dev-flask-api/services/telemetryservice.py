import os
import json
import pandas as pd
from flask import jsonify
from llmservice import LLMService
from py2neo import Graph, Node, Relationship

class TelemetryService:
  def __init__(self):
    self.neo4j_driver = Graph("bolt://localhost:7687", auth=("neo4j", "password"))
  
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
        MATCH path = (n)-[*]->(:ALERT)
        where not n.entity = "172.16.200.110" RETURN path""")
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
          MATCH (n)-[*]->(m:ALERT)
        RETURN DISTINCT
          substring(n.entity, apoc.text.indexOf(n.entity, '-') + 2) AS entity
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
          MATCH (n)-[*]->(m:ALERT)
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
    neo4j = self.neo4j_driver
    query = f"""
    MATCH (n:ENTITY)
      WHERE n.view = 2
      MATCH (n)-[*]->(m:ALERT)
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
  
  def get_raw_entity_details_neo(self, entity):
    data = []
    try:
      neo4j = self.neo4j_driver
      query = f"""
        MATCH (n:ENTITY)
          WHERE n.view = 2
          MATCH (n)-[*]->(m:ALERT)
          where n.entity contains '{entity}'
          RETURN
              substring(n.entity, apoc.text.indexOf(n.entity, '-') + 2) AS entity,
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
              m.dest_ip as dest_ip,
              m.dest_port as dest_port
          ORDER BY n.entity ASC
        """
      result_df = neo4j.query(query).to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return data
  
  def get_view2(self):
    data = []
    try:
      neo4j = self.neo4j_driver
      result_df = neo4j.query("""
        MATCH (n:ENTITY)-[r]->(m) WHERE n.view = 1 
        AND m.view = 1 WITH n, collect(DISTINCT type(r)) 
        AS relTypes, collect(r) AS relationships, collect(m) 
        AS relatedNodes, elementId(n) as elementId WHERE size(relTypes) >= 2 
        UNWIND relationships AS rel 
        UNWIND relatedNodes AS relatedNode 
        RETURN n, rel, relatedNode, relTypes, elementId
        """).to_data_frame()
      data = result_df.to_json()
    except Exception as e:
      print(e)
    return data
  
  def get_view6(self):
    data = []
    try:
      neo4j = self.neo4j_driver
      result = neo4j.query("""MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n 
      MATCH path = (n)-[*]->(a:ALERT) where 
      not n.entity = "172.16.200.110" 
      and (a.detection_type = "CLOUD_ANOMALY" 
      or a.detection_type = "CLOUD_ALERT") RETURN path""").to_data_frame()
    except Exception as e:
      print(e)
    return jsonify(data)
  
  def get_view7(self):
    data = []
    try:
      neo4j = self.neo4j_driver
      result = neo4j.query("""MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n 
      MATCH path = (n)-[*]->(a:ALERT) 
      where not n.entity = "172.16.200.110" 
      and not (a.detection_type = "CLOUD_ANOMALY" 
      or a.detection_type = "CLOUD_ALERT") RETURN path""").to_data_frame()
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
