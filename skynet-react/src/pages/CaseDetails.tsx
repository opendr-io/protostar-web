import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";

interface CaseDetailsProps 
{
  selected: any;
  setSelected: any;
}

export function CaseDetails({ selected, setSelected } : CaseDetailsProps)
{
  function handleGoBack() 
  {
    setSelected(null);
  }

  return (
    <main className="mx-5">
      <button onClick={handleGoBack} className="bg-black text-white border border-gray-300 mt-4 w-24 h-10 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Back</button>
      <div className="mx-2 mt-4">
        <h1 className="text-xl font-semibold">Case Details</h1>
          {selected && (
            <div className={`flex flex-col mx-4 mt-2`}>
              <h1 className="text-lg font-semibold">Case Name: { selected.casename }</h1>
              <h1 className="text-lg font-semibold">Investigate Entity: { selected.investigated_entity }</h1>
              <div className="mx-2 mt-2">
                <p className="text-base">Priority: { selected.priority }</p>
                <p className="text-base">Description: { selected.description }</p>
              </div>
            </div>
          )}
      </div>
    </main>
  )
}