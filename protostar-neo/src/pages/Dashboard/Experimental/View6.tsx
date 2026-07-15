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
            statement: `MATCH path = ()-[:CONNECTS_HOST {view: 6}]->() RETURN path UNION MATCH path = (:ENTITY {view: 2})-[:CONNECTS_TO {view: 6}]->(:ENTITY {view: 2}) RETURN path`
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
        strength={-1400}
        labelNodeTypes={['ENTITY', 'HOST']}
        directed
      />
    </div>
  );
}
