import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";

interface CasesOverviewProps 
{
  users: any[];
  contentSections: any[];
  ToggleWindow: any;
  isUserListOpen: boolean;
  setIsUserListOpen: any;
  isEntitySelected: boolean;
  setIsEntitySelected: any
  setSelected: any;
  entityTypes: any;
}

function AgentStatusBadge({ properties } : any)
{
  const status = properties ? properties.agent_status : null;
  const styles: any = {
    processed: 'bg-purple-950 text-purple-300 border-purple-700',
    queued: 'bg-yellow-950 text-yellow-300 border-yellow-700',
    failed: 'bg-red-950 text-red-300 border-red-700',
  };
  const labels: any = {
    processed: 'Agent: processed',
    queued: 'Agent: queued',
    failed: 'Agent: failed',
  };
  return (
    <span title="Whether the AI agent has posted a comment on this case" className={`text-xs px-2 py-1 mb-3 rounded-full border w-fit select-none ${styles[status] || 'bg-gray-900 text-gray-400 border-gray-700'}`}>
      {labels[status] || 'Agent: not processed'}
    </span>
  );
}

export function CasesOverview({ users, contentSections, ToggleWindow, isUserListOpen, setIsUserListOpen, isEntitySelected, setIsEntitySelected, setSelected, entityTypes } : CasesOverviewProps)
{
  const [filterStatus, setFilterStatus] = useState('Open');
  const statusOptions = ['Open', 'Closed', 'All'];

  function FilterCasesBasedOnStatus(status: string)
  {
    ToggleWindow(isUserListOpen, setIsUserListOpen);
    setFilterStatus(status);
  }

  function MatchesStatusFilter(resolved_at: any)
  {
    if(filterStatus === 'All') return true;
    return filterStatus === 'Closed' ? !!resolved_at : !resolved_at;
  }

  return (
    <main>
      {/* <p className="select-none mx-4"><span>Filters</span><span className="mx-4">{filterPriority ? (<button onClick={ClearFilters} className="text-blue-500 cursor-pointer">Clear Filter</button>) : ''}</span></p> */}
      <div onClick={() => ToggleWindow(isUserListOpen, setIsUserListOpen)} className="bg-black text-white mx-4 border border-gray-300 mt-4 py-2 p-4 rounded-md hover:bg-gray-600 font-normal cursor-pointer">
        <p className="cursor-pointer select-none" title="Click to open dropdown to filter cases by status">Status: {filterStatus}</p>
        <div id="filterlist" className={`absolute mt-2 w-fit rounded-md shadow-lg bg-white transform transition-all duration-300 ease-in-out ${isUserListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div>
            <ul className="list-inside space-y-4 list-none">
              {statusOptions.map((status) => (
                <li key={status} onClick={() => FilterCasesBasedOnStatus(status)} className="text-gray-800 cursor-pointer px-4 py-2 hover:bg-gray-200 active:bg-gray-400">
                  <span>{status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div id="card" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
        {contentSections.filter(({ resolved_at }) => MatchesStatusFilter(resolved_at)).map(({ case_id, assigned_user, casename, description, priority, investigated_entity, properties, resolved_at }) => (
          <div
            key={case_id}
            className="bg-[#1B1B1B] text-white rounded-lg shadow cursor-pointer aspect-square p-6 flex flex-col"
            onClick={() =>
            {
              setSelected({ case_id, casename, description, assigned_user, priority, investigated_entity, resolved_at });
              ToggleWindow(isEntitySelected, setIsEntitySelected);
            }}>
            <h3 className="text-lg font-semibold">{casename}</h3>
            <p className="text-sm text-gray-400 mb-3">{entityTypes[investigated_entity] || ''}</p>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 mb-3 rounded-full border w-fit select-none ${resolved_at ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-green-950 text-green-300 border-green-700'}`}>{resolved_at ? 'Closed' : 'Open'}</span>
              <AgentStatusBadge properties={properties} />
            </div>
            <p className="line-clamp-4">{description}</p>
          </div>
        ))}
      </div>
    </main>
  )
}