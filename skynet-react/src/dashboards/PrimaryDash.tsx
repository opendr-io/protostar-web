import * as d3 from "d3";
import NetworkGraph from '../components/NetworkGraph.tsx';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import LLMService from '../services/LLMService.ts';
import TelemetryService from "../services/TelemetryService.ts";
import { useScreenshot, createFileName } from 'use-react-screenshot';
import Config from "../config/config.tsx";

// import Graph from 'vis-react';

export function PrimaryDash()
{
  // const ts = new TelemetryService();
  // const llm = new LLMService();
  // const [data, setData] = useState(null);
  // const [width, setWidth] = useState(400);
  // const [height, setHeight] = useState(800);

  // useEffect(() => 
  // {
  //   async function FetchPrimaryViewData()
  //   {
  //     let pgd = await ts.RetrieveGraphData('view2');
  //     console.log(pgd);
  //     // console.log(pgd['elementId(n)']);
  //     // console.log(pgd.n);
  //     // console.log(pgd.relatedNode);
  //     let nLength = Object.keys(pgd.n).length;
  //     let relatedNodeLength = Object.keys(pgd.relatedNode).length
  //     // console.log(Object.keys(pgd.n).length);
  //     // console.log(Object.keys(pgd.relatedNode).length);
  //     // console.log(pgd.n[0]);
  //     // console.log(pgd.relatedNode[0]);
  //     let entities:any = [];
  //     let entityLinks:any = [];
  //     for(let i = 0; i < nLength; i++)
  //     {
  //       entities.push({id: pgd.n[i].id, entity: pgd.n[i].entity, entity_type: pgd.n[i].entity_type, ip: pgd.n[i].ip})
  //     }
  //     const initialNodes = [
  //       { id: "A" },
  //       { id: "B" },
  //       { id: "C" },
  //       { id: "D" },
  //       { id: "E" }
  //     ];

  //     for(let i = 0; i < relatedNodeLength; i++)
  //     {
  //       entityLinks.push({source: pgd.id, target: pgd.n[i].id})
  //     }

  //     const initialLinks = [
  //       { source: "A", target: "B" },
  //       { source: "B", target: "C" },
  //       { source: "C", target: "A" },
  //       { source: "D", target: "E" }
  //     ];
  
  //     // setData({ nodes: initialNodes, links: initialLinks });
  //     setData({ nodes: entities, links: entityLinks });
  
  //     // const newNodeId = String.fromCharCode(initialNodes.length); // Generate a new node ID (A, B, C, ...)
  //     // initialNodes.push({ id: newNodeId });
  //     // initialLinks.push({ source: "A", target: newNodeId });
  
  //     // setData({ nodes: [...initialNodes], links: [...initialLinks] }); // Update state immutably
  //   }
  //   FetchPrimaryViewData();
  //   // const intervalId = setInterval(() => 
  //   // {
  //   //   // Example: Add a new node and link every 3 seconds
  //   //   const newNodeId = String.fromCharCode(65 + initialNodes.length); // Generate a new node ID (A, B, C, ...)
  //   //   initialNodes.push({ id: newNodeId });
  //   //   initialLinks.push({ source: "A", target: newNodeId });

  //   //   setData({ nodes: [...initialNodes], links: [...initialLinks] }); // Update state immutably

  //   // }, 0);
  // }, []);

  // return (
  //   <div className="min-h-screen mx-10 text-3xl font-bold pt-4 bg-black text-white mt-20">
  //     <h1>D3 Network Graph</h1>
  //     {data && <NetworkGraph width={width} height={height} nodes={data.nodes} links={data.links} />}
  //   </div>
  // );
  
  const [primaryDashData, setPrimaryyDashData] = useState(null);
  const [llmQuestion, setLLMQuestion] = useState(null);
  const ts = new TelemetryService();
  const llm = new LLMService();
  const refImage = useRef(null);
  const [storedImage, setStoredImage] = useState(null);
  const [image, takeScreenshot] = useScreenshot({ type: "image/jpeg", quality: 1.0 });
  const config = new Config();

  async function CaptureGraph()
  {
    takeScreenshot(refImage.current).then((img: any) => 
    {
      setStoredImage(img);
    });
  }

  useEffect(() =>
  {
    async function FetchPrimaryViewData()
    {
      let pgd = await ts.RetrieveGraphData('view2');
      // console.log(pgd);
    }
    FetchPrimaryViewData();
  }, []);
  return (
    <div className="flex flex-col min-h-screen mx-10 bg-black text-white mt-[48px]">
      <div className="flex-1">
        <iframe 
          ref={refImage}
          className="w-full h-full rounded-md"
          src={`${config.ServerURL()}:3000/view2`} 
          style={{
            height: `calc(100vh - ${document.querySelector('.h-12')?.offsetHeight || 48}px)`
          }}
        />
      </div>
    </div>
  )
}