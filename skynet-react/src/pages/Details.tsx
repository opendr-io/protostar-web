import { createBrowserRouter, data, RouterProvider } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import { X, Plus, ChevronDown } from 'lucide-react';
import HelpTextService from "../services/HelpTextService.ts";

export function Details()
{
  const [entityDetails, setEntityDetails] = useState<any>([]);
  const [entityFields, setEntityFields] = useState<any>([]);
  const [entityFieldsVisibility, setEntityFieldsVisibility] = useState<any>([]);
  const [llmQuestion, setLLMQuestion] = useState('');
  const [llmOutput, setLLMOutput] = useState('');
  const [open, setOpen] = useState(false);
  const [entityCounter, setEntityCounter] = useState<number>(0)
  let ts = new TelemetryService();
  const llm = new LLMService();
  let ps = new PromptService();
  let hts = new HelpTextService();
  const entity = useSelector((state) => state.data.value);
  const handleChange = (event: any) =>
  {
    setLLMQuestion(event.target.value);
  };
  useEffect(() =>
  {
    async function GetEntityDetails()
    {
      let neoDetails = await ts.RetrieveEntityDetailsNeo(entity[0]);
      let dt = Object.values(neoDetails['detection_type'])
      let kArr:any = Object.keys(neoDetails)
      let dArr:any = Object.values(neoDetails);
      let entitySize = dArr.length + kArr.length + dt.length;
      setEntityCounter(entitySize);
      setEntityDetails(dArr);
      setEntityFields(kArr);
      let visibility = [];
      for(let i = 0; i < entitySize; i++)
      {
        visibility.push(true);
      }
      setEntityFieldsVisibility(visibility);
    }
    GetEntityDetails();
  }, []);

  function RemoveField(fieldIndex: any)
  {
    let x = [...entityFieldsVisibility];
    x[fieldIndex] = false;

    setEntityFieldsVisibility(x);
  }

  function AddField(fieldIndex: any)
  {
    let x = entityFieldsVisibility;
    x[fieldIndex] = true;
  }

  const handleFieldVisibility = async (event: any) =>
  {
    setOpen(false);
  }

  if(entityDetails)
  {
    return (
      <div className="py-4 mx-10 min-h-screen mt-20">
        <h1 className="text-3xl font-bold">Details</h1>
        <div className="mx-4 mt-4 flex flex-col">
          <div>
            <h2 className="font-semibold text-xl mb-2">Entity: <span className="">{entity[0]}</span></h2>
            <h2 className="font-semibold text-xl mb-2">Entity Type: <span className="">{entity[1]}</span></h2>
            <h2 className="font-semibold text-xl mb-4">IP: <span className="">{entity[2]}</span></h2>
            <div className="flex-row mr-4">
              <button title={`${hts.AddFieldsHelpText()}`} onClick={() => setOpen(!open)} className="bg-black text-white border border-gray-300 my-4 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer mr-4">Add Fields</button>
              <button title={`${hts.AISummaryHelpText()}`} onClick={async () => 
                  {
                    let jsonEntityDetails = JSON.stringify(entityDetails);
                    let summaryPrompt = ps.DetailsSummaryPrompt(jsonEntityDetails);
                    let answer = await llm.AskClaude(summaryPrompt);
                    setLLMOutput(answer);
                  }
                } className="bg-black text-white border border-gray-300 mt-4 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">AI Explaination</button>
              <div className={`
                  absolute w-48 rounded-md shadow-lg bg-black 
                  transform transition-all duration-300 ease-in-out
                  ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div>
                  {entityFields.map((option: any, index: any) => (
                    <div onClick={handleFieldVisibility} className={`${!entityFieldsVisibility[index] ? 'block' : 'hidden'}`}>
                      <button className="w-48 text-left px-4 py-2 text-white hover:bg-gray-600 cursor-default"
                        key={index} data-value={option} onClick={() => AddField(index)}>
                        <span>{option}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
          </div>
            <div className="flex mr-96 rounded-2xl">
              <div className="flex flex-row pt-4 mt-4 bg-[#1B1B1B] w-auto rounded-2xl pl-20 pr-24 border">
                {entityFields.map((item:any, fieldIndex:any) => (
                  <div className={`pr-10 ${entityFieldsVisibility[fieldIndex] ? 'block' : 'hidden'}`} key={fieldIndex}>
                    <div title={`${hts.RemoveFieldsHelpText()}`} onClick={() => RemoveField(fieldIndex)} className="font-semibold text-xl"><X className="cursor-pointer" size={15}/>{item}</div>
                    <div className={``} key={fieldIndex}>
                      {Array.from({ length: entityCounter }, (_, index) => (
                        <div className={`mb-4 text-nowrap`}>{entityDetails[fieldIndex][index]}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className=''>
            <div className="flex mt-20 justify-center mx-4">
              <div className={`flex-col w-[80rem]`}>
                <div className="mb-4">
                  <label className="block text-gray-400 font-bold text-xl mb-2 my-4">Enter Question</label>
                  <textarea onChange={handleChange} className="bg-[#1B1B1B] text-gray-200 my-3 shadow resize-none border-gray-300 appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline h-32"  placeholder="Type your question here..." />
                  <div className="flex justify-end">
                    <button title={`${hts.AskAIHelpText()}`} onClick=
                    {async () => 
                      {
                        let jsonEntityDetails = JSON.stringify(entityDetails);
                        let finalPrompt = ps.DetailsPrompt(llmQuestion, jsonEntityDetails);
                        let answer = await llm.AskClaude(finalPrompt);
                        setLLMOutput(answer);
                      }
                    } className="bg-black text-white border border-gray-300 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Ask AI</button>
                  </div>
                </div>
                <div className="mb-24">
                  <label className="block text-gray-400 font-bold text-xl mb-2 my-4">Output</label>
                  <p className="overflow-visible">
                    <textarea readOnly={true} placeholder={llmOutput} className="bg-[#1B1B1B] text-gray-200 border-gray-300 overflow-y-auto cursor-default my-3 shadow resize-none appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline h-150" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  else
  {
    <div className="my-4 mx-10 mt-20">
      <h1 className="text-3xl font-bold">Details</h1>
    </div>
  }
}