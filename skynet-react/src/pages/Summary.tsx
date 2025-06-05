import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import LLMService from '../services/LLMService.ts';
import { useDispatch } from 'react-redux';
import { setData } from "../other/DataManagement.ts";
import { X, Plus, ChevronDown } from 'lucide-react';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";

function GetData(entity: string, dataSet: any[][])
{
  let finalList = dataSet.filter(sl => sl[0] == entity);
  return finalList;
}

export function Summary()
{
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [llmQuestion, setLLMQuestion] = useState('');
  const [llmAlertQuestion, setLLMAlertQuestion] = useState('');
  const [highLevelDataFieldVisibility, setHighLevelDataFieldVisibility] = useState<any>([]);
  const [highLevelDataFields, setHighLevelDataFields] = useState<any>([]);
  const [highLevelData, setHighLevelData] = useState<any>([]);
  const [llmOutput, setLLMOutput] = useState('');
  const ts = new TelemetryService();
  const llm = new LLMService();
  let ps = new PromptService();
  let hts = new HelpTextService();

  useEffect(() =>
  {
    function ManipulateDataEntry(data: string)
    {
      let splitData = data.split(',');
      let furtherSplit = splitData[splitData.length - 2].split(/-(.*)/, 2);
      let entity = furtherSplit[furtherSplit.length - 1].trim();
      let atomicWeightField = furtherSplit[0].split(':')[0].trim().replace(/\b\w/g, letter => letter.toUpperCase());
      let atomicWeight = furtherSplit[0].split(':')[1];
      let updatedEntry = [entity, splitData[1], splitData[2], atomicWeight, splitData[3]];
      return { updatedEntry, atomicWeightField };
    }

    function ManipulateDataFields(fields: string, atomicField: string)
    {
      let splitData = fields.split(',');
      let updatedEntry = [splitData[3], splitData[0], splitData[1], atomicField, 'Atomic Mass'];
      return updatedEntry;
    }
    
    async function FetchData()
    {
      let pgd = await ts.RetrieveGraphData('view2');
      let highLevelDataFields = new Set();
      let highLevel = new Set();
      let midLevelData:any = []; 
      Object.entries(pgd.n).forEach(([key, value]) => 
      {
        let str = '';
        let str2 = '';
        Object.entries(value).forEach(([k, v], i) =>
        {
          str += `${v},`;
          if(i > 0)
          {
            str2 += `${k.toLocaleLowerCase().replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())},`;
          }
        });
        str = str.trim();
        let d = ManipulateDataEntry(str);
        let f = ManipulateDataFields(str2, d.atomicWeightField);
        highLevel.add(d.updatedEntry.toString());
        highLevelDataFields.add(f.toString());
        midLevelData.push(d.updatedEntry);
      });
      let highLevelDataFieldsList = (Array.from(highLevelDataFields)[0] as string).split(',');
      let highLevelDataList = Array.from(highLevel, h => h.split(','));
      let visibility = [];

      for(let i = 0; i < highLevelDataList.length; i++)
      {
        for(let q = 0; q < highLevelDataList[i].length; q++)
        {
          highLevelDataFieldsList.push(highLevelDataList[i][q]);
          visibility.push(true);
        }
      }
      for(let i = 0; i < 4; i++)
      {
        visibility.push(true);
      }
      setHighLevelDataFieldVisibility(visibility);
      highLevelDataList.concat(highLevelDataFieldsList);
      setHighLevelData(highLevelDataList);
      setHighLevelDataFields(highLevelDataFieldsList);
      let output = localStorage.getItem('threatstatussummary');
      if(output !== null)
      {
        setLLMOutput(output);
      };
    }
    FetchData();
  }, []);
  const handleChange = (event: any) =>
  {
    setLLMQuestion(event.target.value);
  };

  const handleAlertChange = (event: any) =>
  {
    setLLMAlertQuestion(event.target.value);
  }

  const handleFieldVisibility = async (event: any) =>
  {
    setOpen(false);
  }

  function RemoveField(fieldIndex: any)
  {
    let x = [...highLevelDataFieldVisibility];
    for(let i = fieldIndex; i < x.length; i+=5)
    {
      x[i] = false;
    }
    setHighLevelDataFieldVisibility(x);
  }

  function AddField(fieldIndex: any)
  {
    let x = highLevelDataFieldVisibility;
    for(let i = fieldIndex; i < x.length; i+=5)
    {
      x[i] = true;
    }
  }

  if(highLevelDataFields)
  {
    return (
      <div className="relative min-h-screen mt-20">
        <h1 className="text-3xl font-bold pt-4 mx-10">Tactical</h1>
        <div className="text-sm text-gray-400 dark:text-gray-300 mx-12 mt-2">
          Summary dashboard of assembled detection elements for entities (endpoints, hosts, users) scored and prioritized.
        </div>
        <div className="mx-10 flex">
          <div className="flex-row mr-4">
            <button title={`${hts.AddFieldsHelpText()}`}
              onClick={() => setOpen(!open)}
              className="bg-black text-white border border-gray-300 mt-4 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">
              Add Fields
            </button>
            <div className={`
                absolute mt-2 w-48 rounded-md shadow-lg bg-black 
                transform transition-all duration-300 ease-in-out
                ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div>
                {highLevelDataFields.map((option: any, index: any) => (
                  <div onClick={handleFieldVisibility} className={`${(index < 5 && !highLevelDataFieldVisibility[index]) ? 'block' : 'hidden'}`}>
                    <button className="w-48 text-left px-4 py-2 text-white hover:bg-gray-600 cursor-default"
                      key={index} data-value={option} onClick={() => AddField(index)}>
                      <span>{option}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-row">
            <button title={`${hts.AISummaryHelpText()}`} onClick=
              {async () =>
                {
                  let finalPrompt = ps.ThreatStatusSummaryPrompt(highLevelData);
                  let answer = await llm.AskClaude(finalPrompt);
                  setLLMOutput(answer);
                }
              } className="bg-black text-white border border-gray-300 mt-4 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">AI Summary</button>
          </div>
        </div>
        <div className="flex mt-24 justify-center text-sm bg-[#1B1B1B] text-center py-4 mx-52 rounded-2xl">
          <div className="grid grid-cols-5 mx-4">
          {Array.from(highLevelDataFields).map((item: any, index: any) => 
          {
            let textColor = 'text-white';
            if(index > 0 && index % 5 === 0)
            {
              textColor = 'text-blue-600';
            }
            
            for(let i = 0; i <= 4; i++) 
            {
              if((index - i > 4) && ((index - i) % 5 === 0) && (highLevelDataFields[index - i + 3] > 5))
              {
                textColor = 'text-red-600';
              }
            }
            return (
              <div>
                <div key={index} className={`${textColor} ${(index < 5) ? 'font-semibold' : 'font-normal'} px-2 py-2 border-gray-400 inline-table `}>
                    {index > 4 && index % 5 == 0 ? (
                      <span title={`${hts.EntityHelpText()}`} className="cursor-pointer" onClick={() => 
                      {
                        let entity = item;
                        let entityType = highLevelDataFields[index+1];
                        let ip = highLevelDataFields[index+2];
                        let displayFields = [entity, entityType, ip];
                        dispatch(setData(displayFields));
                        navigate('/details');
                      }}>{item}</span>
                    ) : (
                      <span className={`cursor-default ${highLevelDataFieldVisibility[index] ? 'block' : 'hidden'}`}>{index <= 5 && index > 0 ? (<span title={`${hts.RemoveFieldsHelpText()}`} onClick={handleFieldVisibility}><X onClick={() => RemoveField(index)} className="cursor-pointer" size={15}/>{item}</span>) : (<span>{item}</span>)} </span>
                    )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
        <div className="flex mt-4 justify-center mx-4">
          <div className={`${highLevelData ? 'flex' : 'hidden'} flex-col w-[80rem]`}>
            <div className="mb-4">
              <label className="block text-gray-400 font-bold text-xl mb-2 my-4">Enter Question</label>
              <textarea onChange={handleChange} className="my-3 shadow resize-none border-gray-300 bg-[#1B1B1B] appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline h-32"  placeholder="Type your question here..." />
              <div className="flex justify-end mb-4">
                <button title={`${hts.AskAIHelpText()}`} onClick=
                {async() => 
                  {
                    let finalPrompt = ps.ThreatStatusPrompt(llmQuestion, highLevelData);
                    let answer = await llm.AskClaude(finalPrompt);
                    setLLMOutput(answer);
                  }
                } className="bg-black text-white border border-gray-300 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Ask AI</button>
              </div>
            </div>
            <div className="mb-24">
              <label className="block text-gray-400 font-bold text-xl mb-2 my-4">Output</label>
              <p className="overflow-visible">
                <textarea readOnly={true} placeholder={llmOutput} className="bg-[#1B1B1B] text-gray-200 border-gray-300 overflow-y-auto cursor-default my-3 shadow resize-none appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline h-96" />
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  else
  {
    return <h1 className="pl-10 text-3xl font-bold pt-4 mt-20">Summary</h1>
  }
}