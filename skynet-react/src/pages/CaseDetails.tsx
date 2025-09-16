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
  const [comments, setComments] = useState([])
  function handleGoBack()
  {
    setSelected(null);
  }

  async function LoadComments()
  {
    let comments = await appService.LoadCaseComments(selected.case_id);
    setComments(comments.flat())
  }

  function ClearData()
  {
    setComment("");
  }

  useEffect(() => 
  {
    LoadComments();
  }, []);

  function SubmitComment(event: any)
  {
    event.preventDefault();
    let assginedUser:any = localStorage.getItem('username');
    appService.PostComment(assginedUser, comment, selected.case_id);
    ClearData();
    for(let i = 0; i < 2; i++)
    {
      LoadComments();
    }
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
          <div className="bg-[#1B1B1B] mt-2">
            <p>Comment Post</p>
            <div>
              {comments.map((item, index) => (
                <li key={index} className="text-white cursor-pointer px-4 py-2 hover:bg-gray-600 list-none">
                  <span className="mx-1">{item.f1}</span>
                  <span className="mx-1">{item.f2}</span>
                  <span className="mx-1 text-xs">{item.f3}</span>
                </li>
              ))}
            </div>
          </div>
          <form onSubmit={SubmitComment}>
            <button type="submit" className="px-4 mt-4 cursor-pointer border mb-2 w-full py-2 bg-black text-white rounded hover:bg-gray-600 active:bg-gray-800">Post Comment</button>
            <textarea className="block w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-black transition-colors duration-200" onChange={(e) => setComment(e.target.value)} rows={6} placeholder="Enter Comment" />
          </form>
        </div>
      </div>
    </main>
  )
}