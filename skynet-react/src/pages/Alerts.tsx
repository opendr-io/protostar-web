import { createBrowserRouter, data, RouterProvider, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
// import Papa, { parse } from 'papaparse';
import LLMService from '../services/LLMService.ts';
import TelemetryService from "../services/TelemetryService.ts";
import PromptService from "../services/PromptService.ts";
import HelpTextService from "../services/HelpTextService.ts";

function MergeData(entityDetails: any, index: any)
{
  let mergedData = []
  for(let i = 0; i < 12; i++)
  {
    mergedData.push(entityDetails[i][index]);
  }
  return mergedData;
}

export function Alerts()
{
  const [llmQuestion, setLLMQuestion] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [entities, setEntities] = useState<any>(null);
  const [entityCounter, setEntityCounter] = useState<number>(0)
  const [entityDetails, setEntityDetails] = useState<any>(null);
  const [llmOutput, setLLMOutput] = useState('');
  const data = useLocation().state;
  const llm = new LLMService();
  const ts = new TelemetryService();
  const ps = new PromptService();
  let hts = new HelpTextService();

  async function FetchEntities()
  {
    let neoEntities = await ts.GetEntitiesNeo();
    let neoEArr = Object.values(neoEntities['entity']);
    let neoDetails = await ts.RetrieveRawEntityDetailsNeo(neoEArr[0]);
    let neoDArr = Object.values(neoDetails);
    setEntityCounter(neoEArr.length)
    setEntities(neoEArr);
    setEntityDetails(neoDArr);
  }

  useEffect(() =>
  {
    FetchEntities();
    if(data) 
    {
      LoadEntityData(data);
    }
  }, []);
  
  const handleChange = (event: any) =>
  {
    setLLMQuestion(event.target.value);
  };

  async function LoadEntityData(entity: any)
  {
    console.log(entity);
    setEntityDetails(null);
    let neoDetails = await ts.RetrieveRawEntityDetailsNeo(entity);
    let neoDArr = Object.values(neoDetails);
    let l = Object.values(neoDetails['name']);
    setEntityCounter(l.length);
    setEntityDetails(neoDArr);
  }

  const handleEntityDataStorage = async (event: any) =>
  {
    setIsOpen(!isOpen);
    LoadEntityData(event.currentTarget.dataset.value);
  }
  
  if(entities)
  {
    return (
      <div className="relative min-h-screen mt-20">
        <h1 className="pl-10 text-3xl font-bold pt-4">Alerts</h1>
        <div className="mx-10">
          <button title={`${hts.EntityDropdownHelpText()}`}
            onClick={() => setIsOpen(!isOpen)}
            className="bg-black text-white border border-gray-300 mt-4 w-full py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">
            Select an Entity
          </button>
          <div className={`
              absolute mt-2 w-96 rounded-md shadow-lg bg-black 
              transform transition-all duration-300 ease-in-out
              ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            `}>
            <div>
              {entities.map((option: any, index: any) => (
                <button className="block w-full text-left px-4 py-2 bg-[#080808] text-white hover:bg-gray-600"
                  key={index} data-value={option}
                  onClick={handleEntityDataStorage}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-10 pb-24 text-wrap">
          {entityDetails && entityDetails.map((card: any, index: any) => (
          <div className={`transition-all duration-300 ease-in-out ${expandedCardIndex === index ? 
            'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[81%] h-[81%] z-50 origin-top' : 'w-full'} ${index < entityCounter ? 'block' : 'hidden'} rounded overflow-hidden shadow-lg bg-white`}>
            <div className={`${(expandedCardIndex === index) ? 'bg-[#080808]' : 'bg-[#1B1B1B]'} flex flex-row text-white h-full`}>
              <div className="px-10 py-6 w-fit">
                <div className="font-bold text-xl mb-2">Entity: {entityDetails[0][index]}</div>
                <div className="font-medium text-xl mb-2">DT: {entityDetails[1][index]}</div>
                <div className="font-medium text-xl mb-2">Name: <span className={`${(expandedCardIndex === index) ? 'text-xl' : 'text-sm'}`}>{entityDetails[3][index]}</span></div>
                <div className="font-medium text-xl mb-2">Mitre Tactic: {entityDetails[2][index]}</div>
                <div>
                  <div className="text-white text-base">
                    {entityDetails[0][index] != '' && expandedCardIndex === index && (
                      <div className="bg-[#242124] px-4 py-8 rounded w-fit h-fit mt-4">
                        <p><span className="font-semibold">Severity: </span>{ entityDetails[5][index] }</p>
                        <p><span className="font-semibold">Host IP: </span>{ entityDetails[10][index] }</p>
                        <p><span className="font-semibold">Source IP: </span>{ entityDetails[11][index] }</p>
                        <p><span className="font-semibold">Dest IP: </span>{ entityDetails[13][index] }</p>
                        <p><span className="font-semibold">Dest Port: </span>{ entityDetails[14][index] }</p>
                        <p><span className="font-semibold">GUID: </span>{ entityDetails[7][index] }</p>
                        <p><span className="font-semibold">Timestamp: </span>{ entityDetails[4][index] }</p>
                        <p><span className="font-semibold">Name: </span>{ entityDetails[3][index] }</p>
                        <p><span className="font-semibold">Category: </span>{ entityDetails[8][index] }</p>
                        <p><span className="font-semibold">Mitre Tactic: </span>{ entityDetails[2][index] }</p>
                        <p><span className="font-semibold">Entity Type: </span>{ entityDetails[6][index] }</p>
                        <br />
                        <p>Can include more detailed information about the alert</p>
                      </div>
                    )}
                  </div>
                  <button title={`${hts.AIDetailsHelpText()}`} onClick=
                    {async() => 
                      {
                        let entitySpecificData = MergeData(entityDetails, index);
                        let finalPrompt = ps.AlertSummaryPrompt(entityDetails, entitySpecificData);
                        let lm = await llm.AskLLM(finalPrompt);
                        setLLMOutput(lm);
                      }
                    } className={`${(expandedCardIndex === index) ? 'block' : 'hidden'} bg-[#080808] text-white border border-gray-300 mt-4 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer`}>Explain Alert Details</button>
                </div>
                <div className="pt-6 pb-2">
                  <div className="flex justify-start">
                  <button className={`${expandedCardIndex === index ? 'fixed bottom-0 left-0 m-4 hover:bg-red-800' : 'hover:bg-gray-400'} bg-[#BCBCBC] border-solid text-black font-bold py-2 px-4 rounded mt-4 cursor-pointer`}
                    onClick={() =>
                      {
                        setExpandedCardIndex((expandedCardIndex === index) ? null : index);
                        setLLMOutput('');
                      }
                    }>
                    {expandedCardIndex === index ? 'Close Details' : 'Alert Details'}
                  </button>
                  </div>
                </div>
              </div>
              <div className={`${expandedCardIndex === index ? 'block' : 'hidden'} w-7/12 p-6`}>
                <div className="mb-4">
                  <label className="block text-gray-400 font-bold text-xl mb-2 my-4">Ask Question</label>
                  <textarea onChange={handleChange} className="my-3 w-full h-32 shadow resize-none appearance-none border bg-[#1B1B1B] rounded border-gray-300 py-2 px-3 text-gray-300 leading-tight focus:outline-none focus:shadow-outline"  placeholder="Type your question here..." />
                  <div className="flex justify-end mb-4">
                    <button title={`${hts.AskAIHelpText()}`} onClick=
                    {async() => 
                      {
                        let entitySpecificData = MergeData(entityDetails, index);
                        let finalPrompt = ps.AlertPrompt(llmQuestion, entityDetails, entitySpecificData);
                        let output = await llm.AskLLM(finalPrompt);
                        setLLMOutput(output);
                      }
                    } className="bg-black text-white border border-gray-300 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Ask AI</button>
                  </div>
                </div>
                <div className="mb-24">
                  <label className="block text-gray-700 font-bold text-xl mb-2 my-4">Output</label>
                  <p className="overflow-visible">
                    <textarea readOnly={true} placeholder={llmOutput} className="h-96 w-full bg-[#1B1B1B] border-gray-300 overflow-y-auto cursor-default my-3 shadow resize-none appearance-none border rounded py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
  
        {/* Overlay when any card is expanded */}
        {expandedCardIndex !== null && (<div className="fixed inset-0 bg-black opacity-50 z-40" onClick={() => setExpandedCardIndex(null)}/>)}
      </div>
    );
  }
  else
  {
    return (
      <div className="relative h-screen mt-20">
        <h1 className="pl-10 text-3xl font-bold pt-4">Alerts</h1>
      </div>
    )
  }
}
