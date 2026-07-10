import { useState, useEffect, useRef } from 'react';
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";

export function Home()
{
  const ts = new TelemetryService();
  const [highLevelDataFieldVisibility, setHighLevelDataFieldVisibility] = useState<any>([]);
  const [highLevelDataFields, setHighLevelDataFields] = useState<any>([]);
  const [highLevelData, setHighLevelData] = useState<any>([]);
  const [tacticalSummary, setTacticalSummary] = useState('');
  const llm = new LLMService();
  let ps = new PromptService();
  async function FetchTacticileInfo()
  {
    let pgd = await ts.RetrieveGraphData('view2');
  }
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
      setHighLevelDataFieldVisibility(visibility);
      highLevelDataList.concat(highLevelDataFieldsList);
      setHighLevelData(highLevelDataList);
      setHighLevelDataFields(highLevelDataFieldsList);
      let firstOutput = await llm.AskLLM(ps.ThreatStatusSummaryPrompt(highLevelDataList));
      localStorage.setItem('threatstatussummary', firstOutput);
      let summaryOutput = await llm.AskLLM(ps.SummaryOfThreatStatusSummaryPrompt(firstOutput));
      localStorage.setItem('summary', summaryOutput);
      setTacticalSummary(summaryOutput);
    }
    let summary = localStorage.getItem('summary');
    if(summary === null)
    {
      FetchData();
    }
    else
    {
      setTacticalSummary(summary);
    }
  }, []);
  return (
    <div className='bg-black text-white min-h-screen mt-20 px-4'>
      <div className='max-w-6xl mx-auto'>
        <h1 className="text-3xl font-bold mt-4">Protostar: AI Powered Detection Management</h1>
        <h1 className="mt-4 flex-1">
        
          Tactical: An AI interface into detection elements by entity. From here, you can drilldown into the details of a detection element and ask questions of the AI interface<br></br><br></br>
          Visual: Graphs of the detection elements From here, you can drilldown into the a subgraph of a single detection element or read its component alerts and elements. In the visual graph interface, there are three levels of detection elements: alpha, beta and gamma. Alpha elements have the highest atomic weights and are the most critical. Other element types include isotopes and signal coefficients. <br></br><br></br>
          Alerts: AI interface into individual alerts for an entity graph. From here you can ask questions about alerts and detection elements.
         </h1>
        <div className='mt-4 flex-1'>
        <h1 className="text-2xl font-bold mt-4">Situation Report:</h1>
          <h1><br></br>The latest AI analysis and recomendations will appear below. The summary includes a high level overview of the
            open threat detection elemets, the type of entity in each detecton element, and overall reccomendations. </h1>
          <div className="mt-4">
            <textarea readOnly={true} 
                      placeholder={tacticalSummary} 
                      style={{
                        '--base-size': `${tacticalSummary.length/40}rem`
                      } as React.CSSProperties} 
                      className="bg-[#1B1B1B] calculated-textarea-height w-full h-[calc(100vh-12rem)] text-gray-200 border-gray-300 overflow-y-auto cursor-default my-3 shadow resize-none appearance-none border rounded py-2 px-3 leading-tight focus:outline-none focus:shadow-outline" />
          </div>
        </div>
      </div>
    </div>
  )
}