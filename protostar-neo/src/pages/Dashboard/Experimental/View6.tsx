import { useEffect, useState } from "react";
import { IGraphData, processNodesAndEdges } from '../graphUtils';
import ForceGraph from "../../../components/NetworkGraph/NetworkGraph";

export function View6() 
{
  const dbURL = import.meta.env.VITE_NEO_APP_DB_URL;
  const user = import.meta.env.VITE_NEO_APP_USERNAME;
  const pass = import.meta.env.VITE_NEO_APP_PASSWORD;
  const [graphData, setGraphData] = useState<IGraphData>();
  const [network, setNetwork] = useState<any>({});

  useEffect(() => {
    fetch(`${dbURL}/tx/commit`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${user}:${pass}`)}`,
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statements: [
          {
            statement: `MATCH (n:ENTITY) WHERE n.view = 2 WITH DISTINCT n MATCH path = (n)-[*]->(a:ALERT) where (a.detection_type = "SIGNAL" or a.detection_type = "ML_CORRELATION") RETURN path`
          },
        ],
      }),
    })
      .then((result) => result.json())
      .then((responseJson) => {
        const graphData = responseJson?.results.pop().data;
        setGraphData({ results: graphData });
      });
  }, []);

  useEffect(() => {
    setNetwork(processNodesAndEdges(graphData));
  }, [graphData]);

  return (
    <div style={{ backgroundColor: '#1f1f1f', height: '90vh', width: '97%', margin: '16px' }}>
      <ForceGraph
        nodes={network.nodes ?? []}
        links={network.links ?? []}
        width={"100%"}
        height={"90vh"}
        strength={-500}
        labelNodeTypes={['SEVERITY_CLUSTER']}
      />
    </div>
  );
}
