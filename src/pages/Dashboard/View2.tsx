import { useEffect, useState } from "react";
import { IGraphData, processNodesAndEdges } from './graphUtils';
import ForceGraph from "../../components/NetworkGraph/NetworkGraph";


export function View2() {
  const [graphData, setGraphData] = useState<IGraphData>();
  const [network, setNetwork] = useState<any>({});

  useEffect(() => {
    fetch(`${process.env.REACT_APP_DB_URL}/tx/commit`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${process.env.REACT_APP_USERNAME}:${process.env.REACT_APP_PASSWORD}`)}`,
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statements: [
          {
            statement: `MATCH (h:ENTITY)-[r]->() WHERE NOT type(r) IN ['AS_SOURCE', 'AS_DEST'] WITH h, collect(DISTINCT type(r)) AS relationshipTypes WHERE size(relationshipTypes) >= 2 MATCH p=(h)-[r*]->() RETURN p`,
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
        strength={-200}
      />
    </div>
  );
}
