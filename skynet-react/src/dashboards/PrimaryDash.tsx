import * as d3 from "d3";
import NetworkGraph from '../components/NetworkGraph.tsx';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import LLMService from '../services/LLMService.ts';
import TelemetryService from "../services/TelemetryService.ts";
import Config from "../config/config.tsx";

export function PrimaryDash()
{
  const [primaryDashData, setPrimaryyDashData] = useState(null);
  const [llmQuestion, setLLMQuestion] = useState(null);
  const ts = new TelemetryService();
  const llm = new LLMService();
  const refImage = useRef(null);
  const [storedImage, setStoredImage] = useState(null);
  // const [image, takeScreenshot] = useScreenshot({ type: "image/jpeg", quality: 1.0 });
  const config = new Config();

  // async function CaptureGraph()
  // {
  //   takeScreenshot(refImage.current).then((img: any) => 
  //   {
  //     setStoredImage(img);
  //   });
  // }

  useEffect(() =>
  {
    async function FetchPrimaryViewData()
    {
      let pgd = await ts.RetrieveGraphData('view2');
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