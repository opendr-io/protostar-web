
### Neo4j queries used in Skynet
````
Release queries

View 1:

MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n 
MATCH path = (n)-[*]->(:ALERT) 
where not n.entity = "172.16.200.110" RETURN path

View 2:

MATCH (h:ENTITY)-[r]->() WHERE NOT type(r) 
IN ['AS_SOURCE', 'AS_DEST'] WITH h, 
collect(DISTINCT type(r)) AS relationshipTypes 
WHERE size(relationshipTypes) >= 2 and h.view = 1 
MATCH p=(h)-[r*]->() RETURN p

Experimental

Cloud sets (View6)

MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n 
MATCH path = (n)-[*]->(a:ALERT) where 
not n.entity = "172.16.200.110" 
and (a.detection_type = "CLOUD_ANOMALY" 
or a.detection_type = "CLOUD_ALERT") RETURN path

Non-cloud sets (View7)

MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n 
MATCH path = (n)-[*]->(a:ALERT) 
where not n.entity = "172.16.200.110" 
and not (a.detection_type = "CLOUD_ANOMALY" 
or a.detection_type = "CLOUD_ALERT") RETURN path
```

Queries

List entities:

MATCH (n:ENTITY) RETURN (n)

match(n:ENTITY)
where n.view = 2
return n

Graph entitites and detection relationships:

MATCH (n:ENTITY)-[r]->(m) WHERE n.view = 1 
AND m.view = 1 WITH n, collect(DISTINCT type(r)) 
AS relTypes, collect(r) AS relationships, collect(m) 
AS relatedNodes WHERE size(relTypes) >= 2 
UNWIND relationships AS rel 
UNWIND relatedNodes AS relatedNode 
RETURN n, rel, relatedNode, relTypes


Graph entitites and detection relationships in view 2:

match(n:ENTITY)-[r]->(m)
where n.view = 2
return n,r,m

Entitites with more than 1 detection class:

MATCH (h:ENTITY)-[r]->()
WITH h, collect(DISTINCT type(r)) 
AS relationshipTypes
WHERE size(relationshipTypes) >= 1
MATCH p=(h)-[r]->()
RETURN p

Entitites, alert categories and alerts:

MATCH (n)-[r]->(m)
WHERE n.view = 1 and m.view = 1
return n,r,m

MATCH (n:ENTITY)-[r]->(m)
where n.view = 1 and m.view = 1
return n,r,m

Name clusters:

MATCH (n:ENTITY {view: 2})-[*]->(m:NAME_CLUSTER) 
RETURN DISTINCT m limit 100



Severity clusters:

MATCH path = (n:ENTITY)-[r*]->(m:SEVERITY_CLUSTER)
WHERE n.view = 2 and m.severity = "High"
RETURN path

match(n:ENTITY)-[r]->(m)
where n.view = 2
return n,r,m

MATCH (n:ENTITY) WHERE n.view = 2 
WITH DISTINCT n MATCH path = (n)-[*]->(:ALERT) 
where not n.entity = "172.16.200.110" RETURN path

This is super expensive and not sure what it does:

MATCH (n)-[r]->(m)
WHERE n.view = 2
AND m.view = 2
RETURN n, r, m

Or this:

MATCH (n:ENTITY) WHERE n.view = 2 
WITH DISTINCT n MATCH path = (n)-[*]->(:ALERT) 
where not n.entity = "172.16.200.110" RETURN path

```