import * as d3 from "d3";
import React, { useEffect, useRef } from "react";
import { runForceGraph } from "./runForceGraph";
import { ChatModule } from '../ChatModule/ChatModule';


export enum NodeGroup {
  ENTITY = 1,
  SEVERITY_CLUSTER = 2,
  NAME_CLUSTER = 3,
  ALERT = 4,

  LOW_SEVERITY = 5,
  MEDIUM_SEVERITY = 6,
  HIGH_SEVERITY = 7,
}

export enum NodeType {
  ENTITY = 'ENTITY',
  SEVERITY_CLUSTER = 'SEVERITY_CLUSTER',
  NAME_CLUSTER = 'NAME_CLUSTER',
  ALERT = 'ALERT',
}

export interface Node extends d3.SimulationNodeDatum {
  id: string;
  index: number;
  group: number;
  count?: number;
  type?: string;
}

export interface Link {
  source: Node;
  target: Node;
}

type Props = {
  nodes: Node[];
  links: Link[];
  width: number | string;
  height: number | string;
  strength: number;
  labelNodeTypes?: NodeType[keyof NodeType][]
};

const ForceGraph: React.FC<Props> = ({
  nodes,
  links,
  width,
  height,
  strength,
  labelNodeTypes = ['ENTITY', 'SEVERITY_CLUSTER', 'NAME_CLUSTER'], // default nodes to be labelled, override this prop to label other node types
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let destroyFn;

    if (containerRef.current) {
      const { destroy } = runForceGraph(
        containerRef.current,
        links,
        nodes,
        strength,
        labelNodeTypes,
      );
      destroyFn = destroy;
    }

    return destroyFn;
  }, [nodes, links, strength]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={containerRef} style={{ width, height, border: '1px solid lightgrey', borderRadius: 8, overflow: 'hidden' }}></div>
      <ChatModule graphContainerRef={containerRef} />
      <div id="graph-tooltip" style={{ position: 'absolute', zIndex: 100 }}></div>
    </div>
  );
};

export default ForceGraph;
