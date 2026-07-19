import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Config from '../config/config';

type ConnectionState = 'checking' | 'connected' | 'disconnected';

function ConnectionCard({ name, status, connectedLabel = 'Connected', disconnectedLabel = 'Disconnected' }: { name: string; status: ConnectionState; connectedLabel?: string; disconnectedLabel?: string })
{
  const connected = status === 'connected';
  const checking = status === 'checking';
  const statusText = checking ? 'Checking...' : (connected ? connectedLabel : disconnectedLabel);
  const statusClasses = checking
    ? 'bg-yellow-950 text-yellow-300 border-yellow-700'
    : connected
      ? 'bg-green-950 text-green-300 border-green-700'
      : 'bg-red-950 text-red-300 border-red-700';

  return (
    <div className="bg-[#1B1B1B] border border-gray-700 rounded-lg p-4">
      <p className="text-sm text-gray-400">{name}</p>
      <span className={`inline-block mt-2 text-sm px-3 py-1 rounded-full border ${statusClasses}`}>
        {statusText}
      </span>
    </div>
  );
}

export function Settings()
{
  const [lineLimit, setLineLimit] = useState(40);
  const [logSource, setLogSource] = useState<'api' | 'coraza'>('api');
  const [logText, setLogText] = useState('');
  const [lineCount, setLineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connections, setConnections] = useState<Record<string, ConnectionState>>({
    flask: 'checking',
    neo4j: 'checking',
    postgresql: 'checking',
    proxy: 'checking',
    llm: 'checking'
  });

  const loadConnectionStatus = useCallback(async () =>
  {
    setConnections({ flask: 'checking', neo4j: 'checking', postgresql: 'checking', proxy: 'checking', llm: 'checking' });
    const config = new Config();
    const token = localStorage.getItem('token');
    // the LLM status is inferred from the log tail rather than making a (paid) LLM call:
    // green means no "ERROR llm" lines within the last 100 log lines
    let llmStatus: ConnectionState = 'disconnected';
    try
    {
      const logResponse = await axios.get(config.ApiLogURL(),
      {
        params: { lines: 100 },
        headers: { Authorization: `Bearer ${token}` }
      });
      const logLines = Array.isArray(logResponse.data.lines) ? logResponse.data.lines : [];
      llmStatus = logLines.some((line: string) => String(line).includes('ERROR llm')) ? 'disconnected' : 'connected';
    }
    catch
    {
      llmStatus = 'disconnected';
    }
    try
    {
      const response = await axios.get(config.ConnectionStatusURL(),
      {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections({
        flask: response.data.flask ? 'connected' : 'disconnected',
        neo4j: response.data.neo4j ? 'connected' : 'disconnected',
        postgresql: response.data.postgresql ? 'connected' : 'disconnected',
        proxy: response.data.proxy ? 'connected' : 'disconnected',
        llm: llmStatus
      });
    }
    catch
    {
      setConnections({ flask: 'disconnected', neo4j: 'disconnected', postgresql: 'disconnected', proxy: 'disconnected', llm: llmStatus });
    }
  }, []);

  const loadLog = useCallback(async () =>
  {
    setIsLoading(true);
    setError('');
    try
    {
      const config = new Config();
      const token = localStorage.getItem('token');
      const logUrl = logSource === 'coraza' ? config.CorazaLogURL() : config.ApiLogURL();
      const response = await axios.get(logUrl,
      {
        params: { lines: lineLimit },
        headers: { Authorization: `Bearer ${token}` }
      });
      const lines = Array.isArray(response.data.lines) ? response.data.lines : [];
      setLogText(lines.join('\n'));
      setLineCount(response.data.line_count ?? lines.length);
      setLastUpdated(new Date());
    }
    catch
    {
      setError('Unable to load the log. Confirm that the Flask API is running and your session is valid.');
    }
    finally
    {
      setIsLoading(false);
    }
  }, [lineLimit, logSource]);

  useEffect(() =>
  {
    loadLog();
    loadConnectionStatus();
  }, [loadConnectionStatus, loadLog]);

  const refresh = () =>
  {
    loadLog();
    loadConnectionStatus();
  };

  return (
    <main className="mx-10 py-4 min-h-screen mt-20 text-white">
      <section className="mb-8" aria-labelledby="connectionStatusHeading">
        <h1 id="connectionStatusHeading" className="text-3xl font-bold mb-4">Connection Status</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <ConnectionCard name="Flask API" status={connections.flask} />
          <ConnectionCard name="Neo4j" status={connections.neo4j} />
          <ConnectionCard name="PostgreSQL" status={connections.postgresql} />
          <ConnectionCard name="Reverse Proxy" status={connections.proxy} connectedLabel="Running" disconnectedLabel="Not running" />
          <ConnectionCard name="LLM" status={connections.llm} connectedLabel="No recent errors" disconnectedLabel="Errors in log" />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button type="button" onClick={() => setLogSource('api')}
              className={`px-3 py-1 rounded-md border text-sm cursor-pointer ${logSource === 'api' ? 'bg-white text-black border-white' : 'bg-black text-white border-gray-500 hover:bg-gray-700'}`}>
              API Log
            </button>
            <button type="button" onClick={() => setLogSource('coraza')}
              className={`px-3 py-1 rounded-md border text-sm cursor-pointer ${logSource === 'coraza' ? 'bg-white text-black border-white' : 'bg-black text-white border-gray-500 hover:bg-gray-700'}`}>
              WAF Audit
            </button>
          </div>
          <h2 className="text-3xl font-bold">{logSource === 'coraza' ? 'WAF Audit Log' : 'API Log'}</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showing {lineCount} line(s)
            {lastUpdated && ` - Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="logLineLimit" className="text-sm text-gray-300">Lines</label>
          <select
            id="logLineLimit"
            value={lineLimit}
            onChange={(event) => setLineLimit(Number(event.target.value))}
            className="bg-[#1B1B1B] border border-gray-500 rounded px-3 py-2">
            <option value={40}>40</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1,000</option>
            <option value={2000}>2,000</option>
          </select>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="bg-black text-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 cursor-pointer">
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="bg-red-950 text-red-200 border border-red-700 rounded p-4 mb-4">{error}</p>}

      <pre
        aria-label={logSource === 'coraza' ? 'WAF audit log contents' : 'API log contents'}
        className="bg-[#111111] border border-gray-700 rounded-lg p-4 h-[calc(100vh-12rem)] overflow-auto whitespace-pre text-xs leading-5 text-gray-200 font-mono">
        {isLoading && !logText
          ? 'Loading log...'
          : (logText || (logSource === 'coraza'
            ? 'No WAF audit entries — not running behind the proxy, or no rules have fired.'
            : 'The API log is empty.'))}
      </pre>
    </main>
  )
}
