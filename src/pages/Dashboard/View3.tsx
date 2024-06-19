import { useEffect, useState } from "react";
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
  source_ip?: string; // "172.16.200.184",
  type?: string; // Alert Source
  name?: string; // Alert Category .
}
interface INodeMeta {
  id: number; // 3,
  elementId: string; // "4:ab0cc2df-9265-4a07-862b-74f8164bd766:3",
  type: "node" | "relationship"; // "node",
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

function getGroupFromNodeInfo(nodeMeta: INodeMeta, nodeData: INodeData) {
  switch (true) {
    case nodeMeta.type === "node" &&
      nodeData.type !== undefined &&
      nodeData.name !== undefined:
      // case for alert category node in a graph
      return 5;
    case nodeMeta.type === "node" && nodeData.type !== undefined:
      // case for alert source node in a graph
      return 4;
    case nodeData.severity !== undefined:
      return getGroupFromSeverity(nodeData.severity);
    default:
      return 0;
  }
}

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
    for (let i = 0; i < row.length; i++) {
      for (let j = 0; j < row[i].length; j++) {
        const { elementId, type, id: index } = meta[i][j];
        const { hostname, count, ip } = row[i][j];
        switch (type) {
          case "node":
            const node = {
              id: elementId,
              index: meta[i][j].id,
              hostname,
              count,
              ip,
              group: getGroupFromNodeInfo(meta[i][j], row[i][j]),
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
    }
    for (let i = 0; i < meta.length; i++) {
      for (let j = 0; j < meta[i].length; j++) {
        const { type } = meta[i][j];
        switch (type) {
          case "relationship":
            const edgeId = meta[i][j].elementId;
            const source = `${meta[i][j - 1].id}`;
            const target = `${meta[i][j + 1].id}`;
            const link = {
              source: nodes[source],
              target: nodes[target],
            };
            links[edgeId] = { ...link };
            break;
        }
      }
    }
  }

  return {
    nodes: Object.values(nodes),
    links: Object.values(links),
  };
}

export function View3() {
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
            statement: `MATCH path = (n:ENTITY)-[r*]->(m) where n.view = 1 and m.view = 1 and n.hostname = "conor" return path`,
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
        strength={-150}
      />
    </div>
  );
}
