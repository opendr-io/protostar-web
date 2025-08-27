import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";
import { X, Plus, ChevronDown } from 'lucide-react';

export function Details()
{
  const navigate = useNavigate();
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
      let entitySize = (dArr.length + kArr.length + dt.length);
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
    const newVisibility = [...entityFieldsVisibility];
    newVisibility[fieldIndex] = false;
    setEntityFieldsVisibility(newVisibility);
    
    // Force rerender by updating a dependency or state
    // This ensures the unique values are recalculated
    setEntityCounter(prev => prev); // Triggers rerender without changing value
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

  function NavigateToAlertsPage(entity: any)
  {
    // console.log(entity);
    navigate('/alerts', { state: entity });
  }

  if(entityDetails)
  {
    return (
      <div className="py-4 mx-10 min-h-screen mt-20">
        <h1 className="text-3xl font-bold mb-4">Details</h1>
        <div className="mt-4">
          <h2 className="font-semibold text-xl mb-2">Entity: <span onClick={() => NavigateToAlertsPage(entity[0])} className="cursor-pointer text-blue-600">{entity[0]}</span></h2>
          <h2 className="font-semibold text-xl mb-2">Entity Type: <span className="">{entity[1]}</span></h2>
          <h2 className="font-semibold text-xl mb-4">IP: <span className="">{entity[2]}</span></h2>
        </div>
        <div className="mt-4 flex flex-col">
          <div className="flex">
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
                  {entityFields.map((option: any, index: any) => (
                    <div onClick={handleFieldVisibility} className={`${(index < 5 && !entityFieldsVisibility[index]) ? 'block' : 'hidden'}`}>
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
              <button title={`${hts.AISummaryHelpText()}`} onClick={async () => 
                  {
                    let jsonEntityDetails = JSON.stringify(entityDetails);
                    let summaryPrompt = ps.DetailsSummaryPrompt(jsonEntityDetails);
                    let answer = await llm.AskLLM(summaryPrompt);
                    setLLMOutput(answer);
                  }
                } className="bg-black text-white border border-gray-300 mt-4 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">AI Explaination</button>              
            </div>
            <div className="flex-row">
              <button className="bg-black text-white border border-gray-300 mt-4 w-48 py-2 ml-4 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Create Case</button>
            </div>
          </div>
        </div>

        <div className="flex mt-16 justify-center mx-4">
          <div className="bg-[#1B1B1B] rounded-xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 w-auto min-w-fit max-w-none">
            <div className="p-6">
              <div className="flex gap-4 transition-all duration-300 items-start w-auto min-w-fit">
                {entityFields.map((item: any, fieldIndex: any) => {
                  // Get unique rows based on all visible field combinations
                  const getUniqueRows = () => {
                    if (!entityFieldsVisibility[fieldIndex]) return [];
                    
                    // Get all visible field indices
                    const visibleFieldIndices = entityFields
                      .map((_, index) => index)
                      .filter(index => entityFieldsVisibility[index]);
                    
                    // Create array of row objects with all visible field values
                    const rows = Array.from({ length: entityCounter }, (_, rowIndex) => {
                      const rowData = visibleFieldIndices.reduce((acc, fieldIdx) => {
                        acc[fieldIdx] = entityDetails[fieldIdx]?.[rowIndex] || '';
                        return acc;
                      }, {} as Record<number, any>);
                      
                      return {
                        rowIndex,
                        data: rowData,
                        // Create a unique key based on all visible field values
                        uniqueKey: visibleFieldIndices
                          .map(fieldIdx => entityDetails[fieldIdx]?.[rowIndex] || '')
                          .join('|')
                      };
                    });
                    
                    // Filter for unique rows based on the combination of all visible fields
                    const uniqueRows = rows.filter((row, index, self) => 
                      self.findIndex(r => r.uniqueKey === row.uniqueKey) === index
                    );
                    
                    // Return only the values for the current field from unique rows
                    return uniqueRows.map(row => ({
                      value: row.data[fieldIndex],
                      originalRowIndex: row.rowIndex
                    }));
                  };

                  const uniqueRowsForField = getUniqueRows();

                  return (
                    <div className={`${entityFieldsVisibility[fieldIndex] ? 'flex' : 'hidden'} flex-col relative group/column min-w-[120px] w-auto flex-shrink-0 flex-grow-0`} key={fieldIndex}>
                      <div title={`${hts.RemoveFieldsHelpText()}`} 
                        className="font-semibold text-sm uppercase tracking-wide bg-gray-800 pr-10 border-b-2 border-gray-600 px-3 py-3 rounded-lg flex items-center justify-center text-center min-h-[3rem] text-white group mb-4 w-full flex-shrink-0 relative group/resize">
                        <div onClick={() => {
                            RemoveField(fieldIndex);
                          }}
                          className="flex items-center justify-center cursor-pointer hover:bg-gray-700 rounded-md p-1 transition-colors duration-200 mr-2 flex-shrink-0">
                          <X className="opacity-60 hover:opacity-100 hover:text-red-400 transition-all duration-200 group-hover:scale-110" size={16}/>
                        </div>
                        <span className="select-none truncate flex-1 min-w-0 pointer-events-none">{item}</span>
                        
                        {/* Resize handle */}
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors duration-200 opacity-0 group-hover/resize:opacity-100 flex items-center justify-center z-10"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const column = e.currentTarget.closest('.group\\/column') as HTMLElement;
                            const startWidth = column.offsetWidth;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const newWidth = Math.max(120, startWidth + deltaX);
                              column.style.width = `${newWidth}px`;
                              column.style.minWidth = `${newWidth}px`;
                              column.style.maxWidth = `${newWidth}px`;
                              column.style.flex = 'none';
                            };
                            
                            const handleMouseUp = () => {
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
                          <div className="w-0.5 h-6 bg-gray-400 rounded-full opacity-60"></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full flex-1">
                        {uniqueRowsForField.map((rowData, index) => (
                          <div key={`${fieldIndex}-${rowData.originalRowIndex}-${rowData.value}`} 
                            className={`rounded-lg transition-all duration-200 font-medium text-white hover:bg-gray-800 hover:shadow-md text-sm p-2 min-h-[2.5rem] flex-shrink-0 overflow-x-auto text-center w-full relative group/resize [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full ${(!rowData.value || rowData.value.toString().trim() === '') && index === uniqueRowsForField.length - 1 ? 'hidden' : 'block'}`}
                            style={{
                              textAlign: 'center',
                              whiteSpace: 'nowrap'
                            }}
                            onScroll={(e) => {
                              const element = e.currentTarget;
                              if (element.scrollWidth > element.clientWidth) {
                                element.style.textAlign = 'left';
                              } else {
                                element.style.textAlign = 'center';
                              }
                            }}>
                            <span className="inline-block w-full pointer-events-none">{(rowData.value == "") ? "-" : rowData.value}</span>
                            {/* Resize handle for data cells */}
                            <div className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors duration-200 opacity-0 group-hover/resize:opacity-100 flex items-center justify-center z-10"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const startX = e.clientX;
                                const column = e.currentTarget.closest('.group\\/column') as HTMLElement;
                                const startWidth = column.offsetWidth;
                                
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const deltaX = moveEvent.clientX - startX;
                                  const newWidth = Math.max(120, startWidth + deltaX);
                                  column.style.width = `${newWidth}px`;
                                  column.style.minWidth = `${newWidth}px`;
                                  column.style.maxWidth = `${newWidth}px`;
                                  column.style.flex = 'none';
                                };
                                
                                const handleMouseUp = () => {
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
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

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
                    let answer = await llm.AskLLM(finalPrompt);
                    setLLMOutput(answer);
                  }
                } className="bg-black text-white border border-gray-300 w-48 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Ask AI</button>
              </div>
            </div>
            <div className="mb-24">
              <label className="block text-gray-400 font-bold text-xl mb-2 my-4">Output</label>
              <p className="overflow-visible">
                <textarea readOnly={true} placeholder={llmOutput} style={{
                    '--base-size': `${llmOutput.length/80}rem`
                  } as React.CSSProperties} className="bg-[#1B1B1B] calculated-textarea-height text-gray-200 border-gray-300 overflow-y-auto cursor-default my-3 shadow resize-none appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline h-150" />
              </p>
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