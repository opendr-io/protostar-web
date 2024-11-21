import * as d3 from 'd3';

const COLOR_MAP = {
  0: 'white',     // uncategorised node
  1: 'white',     // host nodes
  2: 'white',     // severity cluster
  3: '#7f7f7f',   // name cluster node
  4: '#7f7f7f',   // alert node
  5: '#ffbaac',   // LOW    severity ALERT
  6: '#ff9585',   // MEDIUM severity ALERT
  7: '#ff584d',   // HIGH   severity ALERT
};

function wrap() {
  let self = d3.select(this),
    textLength = self.node().getComputedTextLength(),
    text = self.text();
  while (textLength > (150 - 2 * 8) && text.length > 0) {
    text = text.slice(0, -1);
    self.text(text + '...');
    textLength = self.node().getComputedTextLength();
  }
}

function getDynamicLabel(node) {
  if (node.view === 2 && node.type === 'SEVERITY_CLUSTER') {
    return `[${node.entity_type}] ${node.entity} (${node.severity})`
  }
  return `${node.name ?? node.detection_type ?? node.severity}${node.count ? `(${node.count})` : ''}`;
}

export function runForceGraph(
  container,
  linksData,
  nodesData,
  strength,
  labelNodeTypes, // list of nodetypes to attach a label to
) {
  const nodes = nodesData;
  const hostNodes = nodesData.filter(node => node.type === 'ENTITY');
  const alertNodes = nodesData
    .filter(node => node.type !== 'ENTITY')
    .sort((nodeA, nodeB) => nodeA.count > nodeB.count);

  const links = linksData;

  // The following list of links will be used to calculate
  // distance between nodes with labels to avaoid overlap
  let nodeMapByCateogry = {}

  const containerRect = container.getBoundingClientRect();
  container.innerHTML = '';
  let width = containerRect.width;
  let height = containerRect.height;

  // const drag = (simulation) => {
  //   const dragstarted = (event, d) => {
  //     if (!event.active) simulation.alphaTarget(0.3).restart();
  //     d.fx = d.x;
  //     d.fy = d.y;
  //   };

  //   const dragged = (event, d) => {
  //     d.fx = event.x;
  //     d.fy = event.y;
  //   };

  //   const dragended = (event, d) => {
  //     if (!event.active) simulation.alphaTarget(0);
  //     d.fx = null;
  //     d.fy = null;
  //   };

  //   return d3
  //     .drag()
  //     .on('start', dragstarted)
  //     .on('drag', dragged)
  //     .on('end', dragended);
  // };

  // Add the tooltip element to the graph
  const tooltip = document.querySelector('#graph-tooltip');
  if (!tooltip) {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.style.opacity = '0';
    tooltipDiv.id = 'graph-tooltip';
    document.body.appendChild(tooltipDiv);
  }
  const tooltipContainer = d3.select('#graph-tooltip');

  const addTooltip = (hoverTooltip, d, x, y) => {
    tooltipContainer.transition().duration(200).style('opacity', 0.9);
    tooltipContainer.transition().duration(200).style('transform', 'scale(1)');
    tooltipContainer
      .html(hoverTooltip(d))
      .style('background-color', 'rgb(31, 31, 31)')
      .style('left', `${x}px`)
      .style('top', `${y - 28}px`);
  };

  const removeTooltip = () => {
    tooltipContainer.transition().duration(200).style('opacity', 0);
    tooltipContainer.transition().duration(200).style('transform', 'scale(0)');
  };

  const svg = d3
    .select(container)
    .append('svg')
    .attr('height', '100%')
    .attr('width', '100%')
    .style('background-color', 'rgb(31, 31, 31)')
    .attr('viewBox', [0, 0, width, height])
    .attr('overflow', 'visible')
    .call(
      d3
        .zoom()
        .on('zoom', function (event) {
          svg.attr('transform', event.transform);
        })
        .translateExtent([
          [-width / 2, -height / 2],
          [width * 1.5, height * 1.5],
        ]),
    );

  const link = svg
    .append('g')
    .attr('class', 'linkLines')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')

  const node = svg
    .append('g')
    .selectAll('g')
    .data(alertNodes)
    .enter()
    .append('g')

  // add circle to group
  node
    .append('circle')
    .attr('r', (d) =>
      Math.sqrt(2) *
      Math.max(1, Math.log(isNaN(d.count) ? 1 : d.count * 20)),
    )
    .attr('fill', (d) => COLOR_MAP[d.group])
    .on('click', (event, d) => {
      if (!labelNodeTypes.includes(d.type))
        addTooltip((t) => t.type.includes('CLUSTER') ? (t.detection_type ?? t.severity) : `${t.name ?? t.detection_type} (${t.count})`, d, event.pageX, event.pageY);
    })
    .on('mouseout', () => {
      removeTooltip();
    })
    .each(d => {
      if (nodeMapByCateogry['hosts']) {
        nodeMapByCateogry['hosts'].push(d)
      } else {
        nodeMapByCateogry['hosts'] = [d];
      }
    })

  // add label to group
  node
    .append('text')
    .text((d) => {
      if (labelNodeTypes.includes(d.type)) {
        if (nodeMapByCateogry[d.detection_type ?? d.severity]) {
          nodeMapByCateogry[d.detection_type ?? d.severity].push(d.id);
        } else {
          nodeMapByCateogry[d.detection_type ?? d.severity] = [d.id];
        }
        return getDynamicLabel(d)
      }
      if (d.type === 'SEVERITY_CLUSTER' || d.type === 'NAME_CLUSTER') {
        if (nodeMapByCateogry['clusters']) {
          nodeMapByCateogry['clusters'].push(d.id);
        } else {
          nodeMapByCateogry['clusters'] = [d.id];
        }

      }
      return null
    })
    .attr('class', 'nodeLabel')

  const hostNode = svg
    .append('g')
    .selectAll('rect')
    .data(hostNodes)
    .enter()
    .append('g')

  hostNode
    .append('rect')
    .attr('class', 'hostNode')
    .attr('fill', (d) => COLOR_MAP[d.group])
    .on('dblclick', (event, d) => {
      event.preventDefault();
      console.log(d.entity);
      window.location = (`/view3/?entity=${d.entity}`)
    });

  hostNode.append('g')
    .attr('class', 'hostLabel')
    .append('text')
    .text((d) => `[${d.entity_type}]` + ' ' + d.entity.toUpperCase())
  // .each(wrap) // this truncates the host label

  const additionalForceLinks = [];
  Object.entries(nodeMapByCateogry).forEach(([clustername, nodecluster]) => {
    for (let i = 0; i < nodecluster.length; i++) {
      for (let j = 1; j < nodecluster.length; j++) {
        const newLink = {
          source: nodecluster[i],
          target: nodecluster[j],
        }
        additionalForceLinks[`${clustername}-${i}-${j}`] = newLink;
      }
    }
  });

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3.forceLink(links).id((d) => `${d.index}`),
    )
    .force('charge', d3.forceManyBody().strength(strength))
    // .force('center', d3.forceCenter(width / 2, height / 2))
    .force('x', d3.forceX(width / 2))
    .force('y', d3.forceY(height / 2));

  simulation
    .force(
      'link',
      d3.forceLink(additionalForceLinks).id((d) => `${d.index}`),
    )

  simulation.on('tick', () => {
    //update link positions
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    // update node positions
    node.attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });


    hostNode.attr('transform', function (d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  });

  return {
    destroy: () => {
      simulation.stop();
    },
    nodes: () => {
      return svg.node();
    },
  };
}
