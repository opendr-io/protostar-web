import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import LLMService from '../services/LLMService.ts';
import TelemetryService from "../services/TelemetryService.ts";
import { createPortal } from 'react-dom';
import Config from "../config/config.tsx";
// import Graph from 'vis-react';

export function EntityDash()
{
  const [entityDashData, setEntityDashData] = useState(null);
  const [llmQuestion, setLLMQuestion] = useState('');
  const ts = new TelemetryService();
  const llm = new LLMService();
  const config = new Config();

  useEffect(() =>
  {
    async function FetchEntityViewData()
    {
      let egd = await ts.RetrieveGraphData('view3');
    }
    FetchEntityViewData();
  }, []);
  return (
    <div className="flex flex-col min-h-screen mx-10 bg-black text-white mt-[48px]">
      <div className="flex-1">
        <iframe 
          className="w-full h-full rounded-md"
          src={`${config.ServerURL()}:3000/view3`} 
          style={{
            height: `calc(100vh - ${document.querySelector('.h-12')?.offsetHeight || 48}px)`
          }}
        />
      </div>
    </div>
  )
}