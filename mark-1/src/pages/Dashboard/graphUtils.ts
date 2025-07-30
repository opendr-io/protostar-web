import { Node, Link, NodeGroup, NodeType } from '../../components/NetworkGraph/NetworkGraph';
import { NodeMeta, NodeData, PathData } from '../../common/types/backend-models.d';

export interface IGraphData {
    results: PathData[];
}

export type ElementID = string;

export function getTypeFromNodeInfo(nodeMeta: NodeMeta, nodeData: NodeData) {
    const isView2 = nodeData.view === 2;
    switch (true) {
        // case for Alert node
        case isView2 && nodeMeta.type === "node" && nodeData.detection_type !== undefined:
            return NodeType.ALERT;

        // case for NameCluster node
        case isView2 && nodeMeta.type === "node" && nodeData.name !== undefined && nodeData.severity !== undefined:
            return NodeType.NAME_CLUSTER;

        // case for SeverityCluster node
        case isView2 && nodeMeta.type === "node" && nodeData.severity !== undefined:
            return NodeType.SEVERITY_CLUSTER;

        case !isView2 && nodeData.name !== undefined:
            return NodeType.ALERT;

        case !isView2 && nodeData.detection_type !== undefined:
            return NodeType.NAME_CLUSTER;

        // case for Entity node
        default:
            return NodeType.ENTITY;
    }
}

export function getGroupFromNodeInfo(nodeMeta: NodeMeta, nodeData: NodeData) {
    const isView2 = nodeData.view === 2;
    switch (true) {
        // case for Alert node
        case isView2 && nodeMeta.type === "node" &&
            nodeData.detection_type !== undefined:
            return NodeGroup.ALERT;

        // case for NameCluster node
        case isView2 && nodeData.name !== undefined && nodeData.severity !== undefined:
            return getGroupFromSeverity(nodeData.severity);

        // case for SeverityCluster node
        case isView2 && nodeMeta.type === "node" && nodeData.severity !== undefined:
            return getGroupFromSeverity(nodeData.severity);

        case !isView2 && nodeData.name !== undefined:
            return getGroupFromSeverity(nodeData.severity);

        case !isView2 && nodeData.detection_type !== undefined:
            return getGroupFromSeverity(nodeData.severity);

        // case for Entity node
        default:
            return NodeGroup.ENTITY;
    }
}

export function getGroupFromSeverity(severity?: string) {
    if (!severity) {
        return 0;
    }
    switch (severity.toUpperCase()) {
        case "HIGH":
            return NodeGroup.HIGH_SEVERITY;
        case "MEDIUM":
            return NodeGroup.MEDIUM_SEVERITY;
        case "LOW":
            return NodeGroup.LOW_SEVERITY;
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
                switch (type) {
                    case "node":
                        const node = {
                            group: getGroupFromNodeInfo(meta[i][j], row[i][j]),
                            type: getTypeFromNodeInfo(meta[i][j], row[i][j]),
                            id: elementId,
                            index: meta[i][j].id,
                            ...row[i][j],
                            x: 0,
                            y: 0,
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
