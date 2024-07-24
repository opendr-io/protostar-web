import * as d3 from "d3";
import React, { useEffect, useRef } from "react";
import { runForceGraph } from "./runForceGraph";


export enum NodeGroup {
ENTITY = 1,
SEVERITY_CLUSTER = 2,
NAME_CLUSTER = 3,
ALERT = 4,

LOW_SEVERITY = 5,
MEDIUM_SEVERITY = 6,
HIGH_SEVERITY = 7,
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
};

const ForceGraph: React.FC<Props> = ({
  nodes,
  links,
  width,
  height,
  strength,
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
      ); 
      destroyFn = destroy;
    }

    return destroyFn;
  }, [nodes, links, strength]);

  return <>
    <div ref={containerRef} style={{ width, height, border: '1px solid lightgrey', borderRadius: 8, overflow: 'hidden' }}></div>
    <div id="graph-tooltip" style={{ position: 'absolute', zIndex: 100}}></div>
  </>
};

export default ForceGraph;
