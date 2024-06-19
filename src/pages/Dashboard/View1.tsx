import React, { useEffect, useState } from "react";
import ForceGraph, {
  Node,
  Link,
} from "../../components/NetworkGraph/NetworkGraph";

interface INodeData {
  view?: number; // 2,
  count?: number; // 64,
  severity?: string; // "High",
  hostname?: string; // "172.16.200.183",
  ip?: string; // "172.16.200.183",
  source_ip?: string; // "172.16.200.184"
}
interface INodeMeta {
  id: number; // 3,
  elementId: string; // "4:ab0cc2df-9265-4a07-862b-74f8164bd766:3",
  type: string; // "node",
  deleted: boolean; // false
}

interface IPathData {
  row: INodeData[][];
  meta: INodeMeta[][];
}

interface IGraphData {
  results: IPathData[];
}

type ElementID = string;

function getGroupFromSeverity(severity?: string) {
  if (!severity) {
    return 0;
  }
  switch (severity.toUpperCase()) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
}

function processNodesAndEdges(graphData: IGraphData | undefined) {
  if (!graphData) {
    return {
      nodes: [],
      links: [],
    };
  }
  const nodes: Record<ElementID, Node> = {};
  const links: Record<ElementID, Link> = {};

  for (let result of graphData.results) {
    const { meta, row } = result;
    for (let i = 0; i < row[0].length; i++) {
      const { elementId, type, id: index } = meta[0][i];
      const { hostname, count, ip } = row[0][i];
      switch (type) {
        case "node":
          const node = {
            id: elementId,
            index: meta[0][i].id,
            hostname,
            count,
            ip,
            group: getGroupFromSeverity(row[0][i].severity),
            x: (index * 37) % 400,
            y: (index * 41) % 400,
            // x: Math.floor(Math.random() * 870) + 20, y:  Math.floor(Math.random() * 660) + 20,
          };
          if (!nodes[`${index}`]) {
            nodes[`${index}`] = { ...node };
          }
          break;
      }
    }
    for (let i = 0; i < meta[0].length; i++) {
      const { type } = meta[0][i];
      switch (type) {
        case "relationship":
          const edgeId = meta[0][i].elementId;
          const source = `${meta[0][i - 1].id}`;
          const target = `${meta[0][i + 1].id}`;
          const link = {
            source: nodes[source],
            target: nodes[target],
          };
          links[edgeId] = { ...link };
          break;
      }
    }
  }

  return {
    nodes: Object.values(nodes),
    links: Object.values(links),
  };
}

export function View1() {
  const [graphData, setGraphData] = useState<IGraphData>();
  const [network, setNetwork] = useState<any>({});

  useEffect(() => {
    fetch("http://localhost:7474/db/neo4j/tx/commit", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa("")}`,
        Accept: "application/json;charset=UTF-8",
        "Content-Type": "application/json",
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
