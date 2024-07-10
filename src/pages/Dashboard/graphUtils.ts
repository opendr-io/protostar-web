import { Node, Link } from '../../components/NetworkGraph/NetworkGraph';

export interface INodeData {
    view?: number; // 2,
    count?: number; // 64,
    severity?: string; // "High",
    hostname?: string; // "172.16.200.183",
    ip?: string; // "172.16.200.183",
    source_ip?: string; // "172.16.200.184",
    type?: string; // Alert Source
    name?: string; // Alert Category .
}

export interface INodeMeta {
    id: number; // 3,
    elementId: string; // "4:ab0cc2df-9265-4a07-862b-74f8164bd766:3",
    type: "node" | "relationship"; // "node",
    deleted: boolean; // false
}

export interface IPathData {
    row: INodeData[][];
    meta: INodeMeta[][];
}

export interface IGraphData {
    results: IPathData[];
}

export type ElementID = string;

export function getGroupFromNodeInfo(nodeMeta: INodeMeta, nodeData: INodeData) {
    switch (true) {
        case nodeMeta.type === "node" &&
            nodeData.type !== undefined &&
            nodeData.name !== undefined:
            // case for alert category node in a graph
            return 5;
        case nodeData.severity !== undefined:
            return getGroupFromSeverity(nodeData.severity);
        case nodeMeta.type === "node" && nodeData.type !== undefined:
            // case for alert source node in a graph
            return 4;
        default:
            return 0;
    }
}

export function getGroupFromSeverity(severity?: string) {
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

export function processNodesAndEdges(graphData: IGraphData | undefined) {
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
                            name: row[i][j].name,
                            type: row[i][j].type,
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
