import { useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import LLMService from '../services/LLMService.ts';
import TelemetryService from "../services/TelemetryService.ts";
import AppService from "../services/AppService.ts";
import PromptService from "../services/PromptService.ts";
import HelpTextService from "../services/HelpTextService.ts";

interface AlertRow
{
  entity: string;
  detection_type: string;
  mitre_tactic: string;
  name: string;
  timestamp: string;
  severity: string;
  entity_type: string;
  guid: string;
  category: string;
  username: string;
  host_ip: string;
  source_ip: string;
  executable: string;
  syscall_name: string;
  process: string;
  proctitle: string;
  message: string;
  dest_ip: string;
  dest_port: string;
  dst_geo: string;
}

// always-present fields live in the row header; the rest render here, skipping empty values
const detailKeysToShow: (keyof AlertRow)[] = [
  "timestamp",
  "category",
  "mitre_tactic",
  "host_ip",
  "source_ip",
  "dest_ip",
  "dest_port",
  "dst_geo",
  "username",
  "syscall_name",
  "executable",
  "process",
  "proctitle",
  "message",
  "guid",
];

const alertsPerPage = 25;

// backend sends pandas to_json: { column: { rowIndex: value } }
function ToAlertRows(payload: any): AlertRow[]
{
  if(!payload || typeof payload !== 'object')
  {
    return [];
  }
  const columns = Object.keys(payload);
  if(columns.length === 0)
  {
    return [];
  }
  const rowKeys = Object.keys(payload[columns[0]] ?? {});
  const rows = rowKeys.map((row) => Object.fromEntries(columns.map((column) => [column, payload[column]?.[row]])) as AlertRow);
  const toMillis = (value: any) => { const parsed = new Date(value).getTime(); return isNaN(parsed) ? 0 : parsed; };
  return rows.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
}

function FormatTimestamp(value: any)
{
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? String(value ?? '') : parsed.toUTCString();
}

export function Alerts()
{
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [visibleExplanations, setVisibleExplanations] = useState<Record<string, boolean>>({});
  const [explainingIndex, setExplainingIndex] = useState<number | null>(null);
  const [explainingAll, setExplainingAll] = useState(false);
  const llm = new LLMService();
  const ts = new TelemetryService();
  const as = new AppService();
  const ps = new PromptService();
  let hts = new HelpTextService();
  const navigatedEntity = useLocation().state;

  const alertKey = (alert: AlertRow, index: number) =>
  {
    if(alert.guid && alert.name && alert.entity)
    {
      return JSON.stringify([alert.guid, alert.name, alert.entity]);
    }
    return `alert-row-${index}`;
  };

  useEffect(() =>
  {
    if(navigatedEntity)
    {
      setSearch(navigatedEntity);
    }
  }, [navigatedEntity]);

  // debounced load: an empty box returns the 100 most recent alerts across all entities, a term filters them
  useEffect(() =>
  {
    const term = search.trim();
    let cancelled = false;
    const handle = setTimeout(async () =>
    {
      setAlerts(null);
      setLoadFailed(false);
      setExplanations({});
      setVisibleExplanations({});
      setExplainingIndex(null);
      setCurrentPage(0);
      const payload = await ts.SearchAlerts(term);
      if(cancelled)
      {
        return;
      }
      if(!payload || typeof payload !== 'object')
      {
        setAlerts([]);
        setLoadFailed(true);
        return;
      }
      setLoadFailed(false);
      const rows = ToAlertRows(payload);
      setAlerts(rows);
    }, term ? 350 : 0);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [search]);

  const pageCount = Math.max(1, Math.ceil((alerts?.length ?? 0) / alertsPerPage));
  const pageStart = currentPage * alertsPerPage;
  const visibleAlerts = (alerts ?? []).slice(pageStart, pageStart + alertsPerPage);

  useEffect(() =>
  {
    let cancelled = false;
    const loadVisibleExplanations = async () =>
    {
      const guids = visibleAlerts.map((row) => row.guid).filter(Boolean);
      if(!guids.length)
      {
        return;
      }
      const stored = await as.GetAlertExplanations(guids);
      if(!cancelled && stored && typeof stored === 'object')
      {
        const keyedStored: Record<string, string> = {};
        visibleAlerts.forEach((alert, index) =>
        {
          if(alert.guid && stored[alert.guid])
          {
            keyedStored[alertKey(alert, pageStart + index)] = stored[alert.guid];
          }
        });
        setExplanations((current) => ({ ...current, ...keyedStored }));
      }
    };
    loadVisibleExplanations();
    return () => { cancelled = true; };
  }, [alerts, currentPage]);

  const GenerateExplanation = async (alert: AlertRow, index: number) =>
  {
    const key = alertKey(alert, index);
    setExplainingIndex(index);
    const finalPrompt = ps.AlertSummaryPrompt(visibleAlerts, alert);
    const output = await llm.AskLLM(finalPrompt);
    setExplanations((current) => ({ ...current, [key]: output || 'The AI request failed. Please try again.' }));
    setVisibleExplanations((current) => ({ ...current, [key]: true }));
    if(output && alert.guid)
    {
      await as.SaveAlertExplanation(alert.guid, alert.entity, output);
    }
  };

  const ExplainAlert = async (alert: AlertRow, index: number) =>
  {
    await GenerateExplanation(alert, index);
    setExplainingIndex(null);
  };

  const ExplainAll = async () =>
  {
    if(!visibleAlerts.length)
    {
      return;
    }
    setExplainingAll(true);
    // explanations is the closure snapshot from click time; only pre-existing keys are skipped
    for(let index = 0; index < visibleAlerts.length; index++)
    {
      const absoluteIndex = pageStart + index;
      if(explanations[alertKey(visibleAlerts[index], absoluteIndex)])
      {
        continue;
      }
      await GenerateExplanation(visibleAlerts[index], absoluteIndex);
    }
    setExplainingIndex(null);
    setExplainingAll(false);
  };

  const ToggleVisible = (key: string) =>
  {
    setVisibleExplanations((current) => ({ ...current, [key]: !current[key] }));
  };

  const explainedKeys = visibleAlerts.map((alert, index) => alertKey(alert, pageStart + index)).filter((key) => explanations[key]);
  const anyExplanations = explainedKeys.length > 0;
  const allVisible = anyExplanations && explainedKeys.every((key) => visibleExplanations[key]);
  const allExplained = visibleAlerts.length > 0 && visibleAlerts.every((alert, index) => explanations[alertKey(alert, pageStart + index)]);
  const busy = explainingAll || explainingIndex !== null;

  const ToggleShowAll = () =>
  {
    const next = !allVisible;
    setVisibleExplanations((current) =>
    {
      const updated = { ...current };
      explainedKeys.forEach((key) => { updated[key] = next; });
      return updated;
    });
  };

  const term = search.trim();
  let statusMessage = '';
  if(loadFailed)
  {
    statusMessage = term ? `Search failed for "${term}". Try a different term.` : 'Something went wrong loading alerts. Try refreshing the page.';
  }
  else if(alerts === null)
  {
    statusMessage = term ? `Searching for "${term}"...` : 'Loading alerts...';
  }
  else if(alerts.length === 0)
  {
    statusMessage = term ? `No alerts match "${term}".` : 'No alerts found.';
  }

  return (
    <div className="relative min-h-screen mt-20">
      {/* <h1 className="pl-10 text-3xl font-bold pt-4">Alerts</h1> */}
      <div className="mx-10 mt-4 flex items-center gap-3">
        <input type="text"
          title={`${hts.AlertSearchHelpText()}`}
          value={search}
          placeholder="Search alerts by entity, entity type, name, or severity..."
          onChange={(event) => setSearch(event.target.value)}
          className="bg-black text-white border border-gray-300 w-1/2 py-2 px-3 rounded-md font-normal focus:outline-none focus:shadow-outline" />
        <button onClick={() => setSearch('')} disabled={!search}
          className="bg-[#080808] text-white text-sm font-normal border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 cursor-pointer">
          Clear
        </button>
        {alerts && alerts.length > 0 && (
          <>
            <button onClick={ExplainAll} disabled={busy || allExplained || !term} title={`${hts.ExplainAllHelpText()}`}
              className="bg-[#080808] text-white text-sm font-normal border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 cursor-pointer">
              {explainingAll ? 'Explaining Alerts In The Set Currently Shown...' : 'Explain Displayed Alerts'}
            </button>
            <button onClick={ToggleShowAll} disabled={!anyExplanations || explainingAll}
              className="bg-[#080808] text-white text-sm font-normal border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 cursor-pointer">
              {allVisible ? 'Hide All' : 'Show All'}
            </button>
            {!term && (
              <span className="ml-auto text-sm text-gray-400">
                Showing the {alerts.length} most recent alerts. Search to narrow across all entities.
              </span>
            )}
          </>
        )}
      </div>

      {statusMessage && <p className="px-10 py-8 text-gray-400">{statusMessage}</p>}

      <div className="flex flex-col gap-2 px-10 py-6 pb-40">
        {visibleAlerts.map((alert, index) => {
          const absoluteIndex = pageStart + index;
          const key = alertKey(alert, absoluteIndex);
          const hasExplanation = !!explanations[key];
          const isThisExplaining = explainingIndex === absoluteIndex;
          const isVisible = !!visibleExplanations[key];
          let buttonLabel = 'Explain';
          if(isThisExplaining) { buttonLabel = 'Explaining...'; }
          else if(hasExplanation) { buttonLabel = isVisible ? 'Hide' : 'Show'; }
          return (
          <div key={key} data-testid="alert-row" className="bg-[#1B1B1B] text-white rounded shadow px-6 py-4">
            <div className="flex flex-wrap items-center gap-x-6 font-bold mb-2">
              <span>entity: "{alert.entity}"</span>
              <span>entity_type: "{alert.entity_type}"</span>
              <span>name: "{alert.name}"</span>
              <span>detection_type: "{alert.detection_type}"</span>
              <span>severity: "{alert.severity}"</span>
              <button title={`${hts.AIDetailsHelpText()}`}
                onClick={() => hasExplanation ? ToggleVisible(key) : ExplainAlert(alert, absoluteIndex)}
                disabled={busy && !isThisExplaining}
                className="ml-auto bg-[#080808] text-white text-sm font-normal border border-gray-300 px-4 py-1 rounded-md hover:bg-gray-600 disabled:opacity-50 cursor-pointer">
                {buttonLabel}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
              {detailKeysToShow.map((detailKey) => (
                (alert[detailKey] && alert[detailKey] !== '-') ? <div key={detailKey}>{detailKey}: "{detailKey === 'timestamp' ? FormatTimestamp(alert[detailKey]) : alert[detailKey]}"</div> : null
              ))}
            </div>
            {(isVisible || isThisExplaining) && (
              <div className="mt-3 bg-[#242124] rounded p-4">
                <span className="font-bold block mb-2">AI Explanation</span>
                <p className="text-gray-200 text-sm whitespace-pre-wrap">
                  {isThisExplaining ? 'Asking the AI about this alert...' : explanations[key]}
                </p>
              </div>
            )}
          </div>
          );
        })}
        {alerts && alerts.length > alertsPerPage && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} disabled={currentPage === 0 || busy}
              className="bg-[#080808] text-white text-sm border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm text-gray-300">Page {currentPage + 1} of {pageCount}</span>
            <button onClick={() => setCurrentPage((page) => Math.min(pageCount - 1, page + 1))} disabled={currentPage >= pageCount - 1 || busy}
              className="bg-[#080808] text-white text-sm border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
