import { useEffect, useState } from "react";
import { IGraphData, processNodesAndEdges } from './graphUtils';
import ForceGraph, { NodeType, NodeGroup } from "../../components/NetworkGraph/NetworkGraph";


export function View2() 
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
            statement: `MATCH (h:ENTITY)-[r]->() WHERE NOT type(r) IN ['AS_SOURCE', 'AS_DEST'] WITH h, collect(DISTINCT type(r)) AS relationshipTypes WHERE size(relationshipTypes) >= 3 and h.view = 1 MATCH p=(h)-[r*..2]->() RETURN p`,
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
    const net = processNodesAndEdges(graphData);
    // View2-only highlight: red any entity that has a 'signal' or 'correlation'
    // relationship (its neighbouring _SET node's detection_type matches). The
    // relationship type itself isn't visible to the frontend, but the _SET node's
    // detection_type is. Scoped here so it does not affect other pages.
    const signalRe = /signal|correlation/i;
    (net.links ?? []).forEach((l: any) => {
      if (l.source?.type === NodeType.ENTITY && signalRe.test(l.target?.detection_type ?? '')) {
        l.source.group = NodeGroup.HIGH_SEVERITY; // red
      }
    });
    setNetwork(net);
  }, [graphData]);

  return (
    <div style={{ backgroundColor: '#1f1f1f', height: '90vh', width: '97%', margin: '16px' }}>
      <ForceGraph
        nodes={network.nodes ?? []}
        links={network.links ?? []}
        width={"100%"}
        height={"90vh"}
        strength={-500}
        labelNodeTypes={['ENTITY', 'NAME_CLUSTER']}
      />
    </div>
  );
}
