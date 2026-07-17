import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  entityTypes: any;
}

export function CaseDetails({ selected, setSelected, appService, telemetryService, entityTypes } : CaseDetailsProps)
{
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [postError, setPostError] = useState("");
  const [posting, setPosting] = useState(false);
  const [entityData, setEntityData] = useState<any>([]);
  const [entityFieldNames, setEntityFieldNames] = useState<any>([]);
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

  function ClearData()
  {
    setComment("");
  }

  useEffect(() =>
  {
    LoadComments();
  }, []);

  async function SubmitComment(event: any)
  {
    event.preventDefault();
    if(posting) return;
    setPosting(true);
    setPostError("");
    let assginedUser:any = localStorage.getItem('username');
    const result = await appService.PostComment(assginedUser, comment, selected.case_id);
    setPosting(false);
    if(!result)
    {
      // keep the draft in the textarea so the user can retry
      setPostError("Couldn't post your comment. Your text is kept below — please try again.");
      return;
    }
    LoadComments();
    if(comment.trim().toLowerCase().startsWith('@agent'))
    {
      // the agent's reply is generated in a background thread server-side; refresh a couple of times to pick it up
      setTimeout(LoadComments, 6000);
      setTimeout(LoadComments, 15000);
    }
    ClearData();
    document.getElementById('txtCommentField').value = '';
  }

  return (
    <main className="mx-5">
      <div className="relative -mx-4">
        <div className="mx-4 mt-4 w-full px-4 py-2 rounded shadow">
            {selected && (
              <div className="rounded-lg shadow-md py-4 px-6 border border-gray-600">
                <div className="flex-row">
                  <form onSubmit={SubmitComment}>
                    <button type="submit" disabled={posting} className="px-4 mt-2 cursor-pointer border mb-2 w-full py-2 bg-black text-white rounded hover:bg-gray-600 active:bg-gray-800 disabled:opacity-50 disabled:cursor-wait">{posting ? 'Posting…' : 'Post Comment'}</button>
                    {postError && (
                      <p className="text-red-400 text-sm mb-2">{postError}</p>
                    )}
                    <textarea id='txtCommentField' className="block w-full p-3 mt-2 border border-gray-300 rounded-md resize-none focus:ring-black transition-colors duration-200" onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) =>
                      {
                        if(e.key === 'Enter' && e.shiftKey)
                        {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={6} placeholder="Enter Comment (start with @agent to ask the AI agent a question; Shift+Enter posts)" required />
                  </form>
                  {comments.length > 0 && (
                    <div className="bg-[#1B1B1B] mt-4">
                      <div className="border border-gray-600 rounded-lg p-2 space-y-1">
                        {comments.map((item, index) => (
                          <li key={index} className="text-white cursor-pointer px-4 py-2 hover:bg-gray-700 list-none">
                            <span className={`mx-1 font-semibold ${item.f1 == 'agent' ? 'text-purple-400' : 'text-teal-400'} `}>{item.f1}</span>
                            <span className="mx-1 text-xs">{item.f3}</span>
                            <div className="mx-1 mt-1 markdown-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.f2}</ReactMarkdown>
                            </div>
                          </li>
                        ))}
                      </div>
                    </div>
                  )}
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