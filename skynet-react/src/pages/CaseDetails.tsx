import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";
import AppService from "../services/AppService.ts";
import { useDispatch } from 'react-redux';
import { setData } from "../other/DataManagement.ts";

interface CaseDetailsProps
{
  selected: any;
  setSelected: any;
  appService: AppService;
  telemetryService: TelemetryService
}

export function CaseDetails({ selected, setSelected, appService, telemetryService } : CaseDetailsProps)
{
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [entityData, setEntityData] = useState<any>([]);
  const [entityFieldNames, setEntityFieldNames] = useState<any>([]);
  function handleGoBack()
  {
    setSelected(null);
  }

  async function LoadComments()
  {
    let comments = await appService.LoadCaseComments(selected.case_id);
    setComments(comments.flat())
  }

  function DedupeValuesPreserveStructure(obj: Record<string, any>): Record<string, any> 
  {
    const result: Record<string, any> = {};
    for(const [key, value] of Object.entries(obj))
    {
      if(Array.isArray(value))
      {
        result[key] = [...new Set(value)];
      }
      else if(typeof value === 'object' && value !== null)
      {
        result[key] = DedupeValuesPreserveStructure(value);
      }
      else
      {
        result[key] = value;
      }
    }
    return result;
  }

  function NavigateToAlertsPage()
  {
    navigate('/alerts', { state: selected.investigated_entity });
  }

  async function NavigateToDetailsPage()
  {
    let displayFields = await LoadCaseData();
    dispatch(setData(displayFields));
    navigate('/details');
  }


  async function LoadCaseData()
  {
    let dataset = await telemetryService.RetrieveRawEntityDetailsNeo(selected.investigated_entity);
    const ed = Object.entries(dataset).map(([key, value]) => ({ key, value }));
    let entity = ed[0].value[0];
    let entityType = ed[6].value[0];
    let ip = ed[10].value[0];
    let displayFields = [entity, entityType, ip];
    return displayFields;
  }

  function ClearData()
  {
    setComment("");
  }

  useEffect(() =>
  {
    LoadComments();
    LoadCaseData();
  }, []);

  async function SubmitComment(event: any)
  {
    event.preventDefault();
    let assginedUser:any = localStorage.getItem('username');
    await appService.PostComment(assginedUser, comment, selected.case_id);
    LoadComments();
    ClearData();
    document.getElementById('txtCommentField').value = '';
  }

  return (
    <main className="mx-5">
      <button onClick={handleGoBack} className="bg-black text-white border border-gray-300 mt-4 w-24 h-10 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Back</button>
      <div className="relative -mx-4">
        <div className="mx-4 mt-4 w-full px-4 py-2 rounded shadow">
            {selected && (
              <div className="rounded-lg shadow-md py-4 px-6 border border-gray-600">
                <h1 className="text-xl font-semibold">Case Details: <span onClick={() => NavigateToAlertsPage()} className="text-blue-600 cursor-pointer">Deeper Dive</span></h1>
                <div className="grid grid-cols-2 mx-4 my-2">
                  <div className="text-base">
                    <div>
                      <h1 className="text-xl font-semibold">Case Name: {selected.casename}</h1>
                      <h2 className="text-lg font-medium mt-1">Investigate Entity: <span onClick={() => NavigateToDetailsPage()} className="text-blue-600 cursor-pointer">{selected.investigated_entity}</span></h2>
                    </div>
                  </div>
                  <div className="font-semibold">
                    <p>Priority: {selected.priority}</p>
                    <p>Description: {selected.description}</p>
                  </div>
                </div>
                <div className="flex-row mt-10">
                  <h1 className="font-semibold">Comments</h1>
                  <div className="bg-[#1B1B1B] mt-2">
                    <div className="max-h-96 overflow-y-auto border border-gray-600 rounded-lg p-2 space-y-1">
                      {comments.map((item, index) => (
                        <li key={index} className="text-white cursor-pointer px-4 py-2 hover:bg-gray-700 list-none">
                          <span className={`mx-1 font-semibold ${item.f1 == 'agent' ? 'text-purple-400' : 'text-teal-400'} `}>{item.f1}</span>
                          <span className="mx-1">{item.f2}</span>
                          <span className="mx-1 text-xs">{item.f3}</span>
                        </li>
                      ))}
                    </div>
                  </div>
                  <form onSubmit={SubmitComment}>
                    <button type="submit" className="px-4 mt-10 cursor-pointer border mb-2 w-full py-2 bg-black text-white rounded hover:bg-gray-600 active:bg-gray-800">Post Comment</button>
                    <textarea id='txtCommentField' className="block w-full p-3 mt-2 border border-gray-300 rounded-md resize-none focus:ring-black transition-colors duration-200" onChange={(e) => setComment(e.target.value)} rows={6} placeholder="Enter Comment" required />
                  </form>
                </div>
              </div>
            )}
        </div>
        {/* <div className="max-w-4xl mx-auto mt-10 space-y-4 p-4 rounded-lg shadow-sm items-center gap-4 mb-2">
          {entityData.map((row: any, i: any) => (
            <div key={i} className="hover:bg-gray-600 cursor-pointer">
              <div className="flex flex-row border border-gray-200 px-4 py-2 font-mono items-center overflow-x-auto min-w-0">
                <span className="mr-4 flex-shrink-0 whitespace-nowrap">{row.key}</span>
                <span className="flex-shrink-0 whitespace-nowrap">{typeof row.value === "object" ? JSON.stringify(row.value) : String(row.value)}</span>
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </main>
  )
}