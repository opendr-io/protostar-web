import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import LLMService from '../services/LLMService.ts';
import TelemetryService from "../services/TelemetryService.ts";
import { createPortal } from 'react-dom';
// import Graph from 'vis-react';

export function EntityDash()
{
  const [entityDashData, setEntityDashData] = useState(null);
  const [llmQuestion, setLLMQuestion] = useState('');
  const ts = new TelemetryService();
  const llm = new LLMService();

  useEffect(() =>
  {
    async function FetchEntityViewData()
    {
      let egd = await ts.RetrieveGraphData('view3');
      console.log(egd);
    }
    FetchEntityViewData();
  }, []);
  return (
    <div className="min-h-screen mx-10 text-3xl font-bold pt-4 bg-black text-white mt-20">
      <h1>Entity Dash</h1>
      <iframe className="mt-4 w-full h-[88vh] rounded-md" src="http://localhost:3000/view3" />
    </div>
  )
}