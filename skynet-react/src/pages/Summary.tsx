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
      for(let i = 0; i < 5; i++)
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
      }
      else
      {
        let finalPrompt = ps.ThreatStatusSummaryPrompt(highLevelData);
        let answer:string = await llm.AskClaude(finalPrompt);
        localStorage.setItem('threatstatussummary', answer);
        let answerSummary = await llm.AskClaude(ps.SummaryOfThreatStatusSummaryPrompt(answer));
        localStorage.setItem('summary', answerSummary);
        setLLMOutput(answer);
      }
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

  const getVisibleItems = () => {
  return highLevelDataFields
    .map((item: any, index: any) => ({ value: item, originalIndex: index }))
    .filter((item: any) => highLevelDataFieldVisibility[item.originalIndex]);
};

// Helper function to count visible columns (for grid layout)
const getVisibleColumnCount = () => {
  // Count visible header columns (first 5 items)
  const visibleHeaders = highLevelDataFieldVisibility.slice(0, 5).filter(Boolean).length;
  return Math.max(visibleHeaders, 1); // Ensure at least 1 column
};

  if(highLevelDataFields)
  {
    return (
      <div className="relative min-h-screen mt-20">
        <h1 className="text-3xl font-bold pt-4 mx-10">Tactical</h1>
        <div className="text-sm text-gray-400 dark:text-gray-300 mx-12 mt-2">
          Summary dashboard of assembled detection elements for entities (endpoints, hosts, users) scored and prioritized.
        </div>
        <div className="mx-10 flex">
           <div className="flex-row mr-4 relative">
              <button title={`${hts.AddFieldsHelpText()}`}
                onClick={() => setOpen(!open)}
                className="bg-black text-white border border-gray-300 mt-4 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">
                Add Fields
              </button>
              <div className={`
                  absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-black z-50
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
        
        <div className="flex mt-16 justify-center px-4">
          <div className="bg-[#1B1B1B] rounded-xl shadow-2xl border border-gray-700 overflow-hidden w-auto min-w-fit max-w-none">
            <div className="p-4">
              <div className="flex gap-2 w-auto min-w-fit transition-all duration-200 items-start">
                {Array.from({ length: getVisibleColumnCount() }).map((_, columnIndex) => (
                  <div key={columnIndex} className="flex flex-col relative group/column min-w-[160px] w-auto flex-shrink-0 flex-grow-0">
                    {getVisibleItems()
                      .filter((_, itemIndex) => itemIndex % getVisibleColumnCount() === columnIndex)
                      .map((item: any, rowIndex: any) => {
                        const displayIndex = rowIndex * getVisibleColumnCount() + columnIndex;
                        const originalIndex = item.originalIndex;
                        let textColor = 'text-white';
                        
                        // Determine if this is a header row (first 5 items in original array)
                        const isHeader = originalIndex < 5;
                        
                        // Determine if this is the start of a new row (entity)
                        const isEntityStart = !isHeader && (originalIndex > 4 && (originalIndex - 5) % 5 === 0);
                        
                        if(isEntityStart) {
                          textColor = 'text-blue-400';
                        }
                        
                        // Check for red coloring logic
                        for(let i = 0; i <= 4; i++) {
                          if((originalIndex - i > 4) && ((originalIndex - i) % 5 === 0) && (highLevelDataFields[originalIndex - i + 3] > 5)) {
                            textColor = 'text-red-400';
                          }
                        }
                        
                        return (
                          <div 
                            key={`${originalIndex}-${displayIndex}`} 
                            className={`
                              ${textColor}
                              ${isHeader ? 'font-semibold text-xs uppercase tracking-wide bg-gray-800 border-b-2 border-gray-600' : 'font-medium text-sm'} 
                              px-4 py-3
                              rounded-lg 
                              transition-all duration-200 
                              ${isEntityStart ? 'hover:bg-gray-800 hover:shadow-md cursor-pointer' : ''}
                              ${isHeader && originalIndex === 0 ? 'bg-gray-700' : ''}
                              flex items-center justify-center text-center
                              min-h-[2.5rem] h-auto
                              relative
                              group/resize
                              whitespace-nowrap
                              w-full
                              overflow-x-auto
                              [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full
                              ${rowIndex === 0 ? 'mb-2' : 'mb-2'}
                            `}
                            title={item.value}
                            onClick={isEntityStart ? () => 
                            {
                              let entity = item.value;
                              let entityType = highLevelDataFields[originalIndex+1];
                              let ip = highLevelDataFields[originalIndex+2];
                              let displayFields = [entity, entityType, ip];
                              dispatch(setData(displayFields));
                              navigate('/details');
                            } : undefined}>
                            {isEntityStart ? (
                              <span 
                                title={`${hts.EntityHelpText()}: ${item.value}`} 
                                className="font-medium w-full px-2 text-center pointer-events-none whitespace-nowrap" >
                                {item.value}
                              </span>
                            ) : (
                              <span className="cursor-default w-full">
                                {isHeader && originalIndex > 0 ? (
                                  <div className="flex items-center justify-center group/header w-full">
                                    <div 
                                      onClick={(e) => 
                                      {
                                        e.stopPropagation();
                                        RemoveField(originalIndex);
                                      }}
                                      className="flex items-center justify-center cursor-pointer hover:bg-gray-700 rounded-md transition-colors duration-200 mr-2 flex-shrink-0">
                                      <X className="opacity-60 hover:opacity-100 hover:text-red-400 transition-all duration-200 group-hover/header:scale-110" size={14}/>
                                    </div>
                                    <span title={`${hts.RemoveFieldsHelpText()}: ${item.value}`} className="select-none flex-1 min-w-0 text-center pointer-events-none whitespace-nowrap">
                                      {item.value}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="block w-full px-2 text-center pointer-events-none whitespace-nowrap" title={item.value}>
                                    {item.value}
                                  </span>
                                )}
                              </span>
                            )}
                            
                            {/* Resize handle */}
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors duration-200 opacity-0 group-hover/resize:opacity-100 flex items-center justify-center z-10"
                              onMouseDown={(e) => 
                              {
                                e.preventDefault();
                                e.stopPropagation();
                                const startX = e.clientX;
                                const column = e.currentTarget.closest('.group\\/column') as HTMLElement;
                                const startWidth = column.offsetWidth;
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => 
                                {
                                  const deltaX = moveEvent.clientX - startX;
                                  const newWidth = Math.max(160, startWidth + deltaX);
                                  column.style.width = `${newWidth}px`;
                                  column.style.minWidth = `${newWidth}px`;
                                  column.style.maxWidth = `${newWidth}px`;
                                  column.style.flex = 'none';
                                };
                                
                                const handleMouseUp = () => 
                                {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                  document.body.style.cursor = '';
                                  document.body.style.userSelect = '';
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                                document.body.style.cursor = 'col-resize';
                                document.body.style.userSelect = 'none';
                              }}>
                              <div className="w-0.5 h-4 bg-gray-400 rounded-full opacity-60"></div>
                            </div>
                            
                            {/* Tooltip for long text - appears on hover */}
                            {item.value && item.value.length > 15 && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap max-w-xs">
                                {item.value}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>
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
                {/* <span className="bg-[#1B1B1B] h-fit text-gray-200 border-gray-300 overflow-y-auto cursor-default my-3 shadow resize-none appearance-none border-x rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline">{llmOutput}</span> */}
                <textarea readOnly={true} placeholder={llmOutput} style={{
                  '--base-size': `${llmOutput.length/70}rem`
                } as React.CSSProperties} className={`bg-[#1B1B1B] calculated-textarea-height text-gray-200 border-gray-300 overflow-y-auto cursor-default my-3 shadow resize-none appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline`} />
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
