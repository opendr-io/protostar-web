export interface EntityNodeData {
  ip: string,
  entity: string,
  entity_type: string,
  view: number,
  source_ip: string,
  dest_ip: string,
  count: number,
};

export interface SeverityClusterNodeData {
  ip: string,
  entity: string,
  entity_type: string,
  view: number,
  source_ip: string,
  count: number,
  severity: 'Low' | 'Medium' | 'High',
  detection_type: string,
};

export interface NameClusterNodeData {
  ip: string,
  entity: string,
  entity_type: string,
  view: number,
  source_ip: string,
  count: number,
  severity: 'Low' | 'Medium' | 'High',
  name: string,
  detection_type: string,
};

export interface AlertNodeData {
  guid: string,
  timestamp: number,
  detection_type: string,
  name: string,
  category: string,
  mitre_tactic: string,
  entity: string,
  entity_type: string,
  host_ip: string,
  source_ip: string,
  dest_ip: string,
  dest_port: string,
  dst_geo: string,
  username: string,
  syscall_name: string,
  executable: string,
  process: string,
  message: string,
  proctitle: string,
  severity: 'Low' | 'Medium' | 'High',
  view: 2
};


export interface NodeMeta {
  id: number;
  elementId: string;
  type: "node" | "relationship"; // "node",
  deleted: boolean;
}

export interface GraphData<T> {
  meta: NodeMeta[][];
  row: T[][];
}

export interface DataGraphResponse<T> {
  errors: Error[];
  lastBookmarks: string[];
  results: {
    columns: string[];
    data: GraphData;
  }[]
}

export type NodeData = EntityNodeData & SeverityClusterNodeData & NameClusterNodeData & AlertNodeData;
export type PathData = GraphData<NodeData>

export interface ListData<T> {
  meta: NodeMeta[],
  row: T[],
}
export interface DataListResponse<T> {
  errors: Error[];
  lastBookmarks: string[];
  results: {
    columns: string[];
    data: ListData<T>[]
  }[]
}