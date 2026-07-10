import * as d3 from 'd3';
import React, { useRef, useEffect, useState } from 'react';

export default function NetworkGraph({ width, height, nodes, links }) 
{
  const svgRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => 
  {
    if (!nodes || !links) return;
    setGraphData({ nodes: nodes, links: links });
  }, [nodes, links]);

  useEffect(() => 
  {
    if (!graphData.nodes.length || !graphData.links.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous elements

    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-1))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "white")
      .attr("stroke-opacity", 1)
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("stroke-width", 1);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .selectAll("circle")
      .data(graphData.nodes)
      .enter().append("circle")
      .attr("r", 5)
      .attr("fill", "steelblue")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("title").text(d => d.id);

    simulation.on("tick", () => 
    {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    function dragstarted(event, d) 
    {
      if (!event.active) simulation.alphaTarget(0.01).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) 
    {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) 
    {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [graphData, width, height]);
  return (
    <svg width={width} height={height} ref={svgRef}></svg>
  );
}