import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";
import AppService from "../services/AppService.ts";

interface CaseDetailsProps 
{
  selected: any;
  setSelected: any;
  appService: AppService
}

export function CaseDetails({ selected, setSelected, appService } : CaseDetailsProps)
{
  const [comment, setComment] = useState("");
  function handleGoBack() 
  {
    setSelected(null);
  }

  function SubmitComment(event: any)
  {
    let assginedUser:any = localStorage.getItem('username');
    appService.PostComment(assginedUser, comment);
    event.preventDefault();
  }

  return (
    <main className="mx-5">
      <button onClick={handleGoBack} className="bg-black text-white border border-gray-300 mt-4 w-24 h-10 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Back</button>
      <div className="flex">
        <div className="mx-2 mt-4 flex">
          <h1 className="text-xl font-semibold">Case Details</h1>
            {selected && (
              <div className={`flex flex-col mx-4 mt-2`}>
                <h1 className="text-lg font-semibold">Case Name: { selected.casename }</h1>
                <h1 className="text-lg font-semibold">Investigate Entity: { selected.investigated_entity }</h1>
                <div className="mx-2 mt-2 flex-row">
                  <p className="text-base">Priority: { selected.priority }</p>
                  <p className="text-base">Description: { selected.description }</p>
                </div>
              </div>
            )}
        </div>
        <div className="flex-row">
          <h1>Comments</h1>
          <div className="bg-[#1B1B1B]">
            <p>Comment Post</p>
          </div>
          <form onSubmit={SubmitComment}>
            <button type="submit" className="px-4 cursor-pointer border mb-2 w-full py-2 bg-black text-white rounded hover:bg-black">Post Comment</button>
            <textarea className="block w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-black transition-colors duration-200" onChange={(e) => setComment(e.target.value)} rows={6} placeholder="Enter Comment" />
          </form>
        </div>
      </div>
    </main>
  )
}