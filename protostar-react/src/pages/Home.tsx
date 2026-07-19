import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";

// the backend returns an empty answer when the LLM call fails (see api.log for the cause)
const LLM_ERROR_MESSAGE = 'No summary was generated — the AI service may be overloaded or unreachable. Reload the page to try again. Details are in the API Log page.';

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
    function ManipulateDataEntry(node: any)
    {
      // Entity names may still be packed as "<label>: <value> - <name>" by older ingestion data
      let furtherSplit = String(node.entity).trim().split(/- (.*)/, 2);
      let entity = furtherSplit[furtherSplit.length - 1].trim();
      let entityType = String(node.entity_type).trim();
      let ip = (String(node.ip).trim() == "" ? "-" : String(node.ip).trim());
      let atomicWeight = (node.atomic_weight === null || node.atomic_weight === undefined ? "-" : String(node.atomic_weight));
      let atomicMass = (node.count === null || node.count === undefined ? "-" : String(node.count));
      let updatedEntry = [entity, entityType, ip, atomicWeight, atomicMass];
      return updatedEntry;
    }

    async function FetchData()
    {
      let pgd = await ts.RetrieveGraphData('view2');
      let highLevel = new Set<string>();
      let midLevelData:any = [];
      Object.entries(pgd.n).forEach(([key, value]) =>
      {
        let updatedEntry = ManipulateDataEntry(value);
        highLevel.add(updatedEntry.toString());
        midLevelData.push(updatedEntry);
      });
      let highLevelDataFieldsList = ['Entity', 'Entity Type', 'Ip', 'Atomic Weight', 'Atomic Mass'];
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
      if(!firstOutput)
      {
        // only cache real answers: a cached empty string would leave the summary blank forever
        setTacticalSummary(LLM_ERROR_MESSAGE);
        return;
      }
      localStorage.setItem('threatstatussummary', firstOutput);
      let summaryOutput = await llm.AskLLM(ps.SummaryOfThreatStatusSummaryPrompt(firstOutput));
      if(summaryOutput)
      {
        localStorage.setItem('summary', summaryOutput);
      }
      setTacticalSummary(summaryOutput || LLM_ERROR_MESSAGE);
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
        <h1 className="text-3xl font-bold mt-4">Protostar: AI Powered Detection Lattices</h1>
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
            <div className="bg-[#1B1B1B] w-full text-gray-200 border border-gray-300 rounded py-2 px-3 my-3 shadow leading-tight markdown-content">
              {tacticalSummary
                ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{tacticalSummary}</ReactMarkdown>
                : <p className="text-gray-500">The AI situation report will appear here</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}