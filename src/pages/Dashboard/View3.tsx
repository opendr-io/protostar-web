import { useEffect, useState } from "react";
import { IGraphData, processNodesAndEdges } from './graphUtils';
import ForceGraph from "../../components/NetworkGraph/NetworkGraph";
import { useParams } from "react-router";

export function View3() {
  const [graphData, setGraphData] = useState<IGraphData>();
  const [network, setNetwork] = useState<any>({});
  const { hostname } = useParams();

  useEffect(() => {
    fetch("http://localhost:7474/db/neo4j/tx/commit", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa("neo4j:password")}`,
        Accept: "application/json;charset=UTF-8",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statements: [
          {
            statement: `MATCH path = (n:ENTITY)-[r*]->(m) where n.view = 1 and m.view = 1 and n.hostname = "${hostname}" return path`,
          },
        ],
      }),
    })
      .then((result) => result.json())
      .then((responseJson) => {
        const graphData = responseJson?.results.pop().data;
        setGraphData({ results: graphData });
      });
  }, [ hostname ]);

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
        strength={-150}
      />
    </div>
  );
}
