import { useEffect, useState } from "react";
import { IGraphData, processNodesAndEdges } from './graphUtils';
import ForceGraph from "../../components/NetworkGraph/NetworkGraph";

export function View1() {
  const [graphData, setGraphData] = useState<IGraphData>();
  const [network, setNetwork] = useState<any>({});

  useEffect(() => {
    console.log({process: process.env});
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
            statement: `MATCH path = (n:ENTITY)-[r*]->(m) WHERE n.view = 2 RETURN path`,
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
    <div>
      <ForceGraph
        nodes={network.nodes ?? []}
        links={network.links ?? []}
        width={"100vw"}
        height={"95vh"}
        strength={-10}
      />
    </div>
  );
}
