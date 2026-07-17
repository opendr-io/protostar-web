import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect, useCallback, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { useDispatch } from "react-redux";
import { setData } from "../other/DataManagement.ts";
import TelemetryService from "../services/TelemetryService.ts";
import AppService from "../services/AppService.ts";
import { CasesOverview } from "./CasesOverview.tsx";
import { CaseDetails } from "./CaseDetails.tsx";

interface CaseRecord
{
  case_id: number;
  assigned_user: string;
  casename: string;
  description: string;
  priority: number;
  investigated_entity: string;
  resolved_at?: string | null;
}

interface CreateCaseResponse
{
  Exists?: string;
  Success?: number;
}

const telemetryService = new TelemetryService();
const appService = new AppService();

export function Cases()
{
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isCaseWizardOpen, setIsCaseWizardOpenOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isEntitySelected, setIsEntitySelected] = useState(false);  
  const [selected, setSelected] = useState<CaseRecord | null>(null);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [casePriority, setCasePriority] = useState("");
  const [caseName, setCaseName] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [caseList, setCaseList] = useState<CaseRecord[]>([]);
  const [userList, setUserList] = useState<unknown[]>([]);
  const [entityList, setEntityList] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<Record<string, string>>({});
  const [aiCommenting, setAICommenting] = useState(false);

  const navigatedEntity = useLocation().state as string | null;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { caseId } = useParams();

  // the open case is driven by the URL (/cases/:caseId) so refresh, back/forward and shared links work
  useEffect(() =>
  {
    if(!caseId)
    {
      setSelected(null);
      return;
    }
    if(caseList.length === 0) return;
    const match = caseList.find(c => String(c.case_id) === caseId);
    if(match)
    {
      setSelected(match);
    }
    else
    {
      // unknown or stale case id: fall back to the list
      navigate('/cases', { replace: true });
    }
  }, [caseId, caseList, navigate]);

  function SelectCase(caseRecord: CaseRecord | null)
  {
    if(caseRecord)
    {
      navigate(`/cases/${caseRecord.case_id}`);
    }
    else
    {
      navigate('/cases');
    }
  }

  function NavigateToCaseAlertsPage()
  {
    if(selected)
    {
      navigate('/alerts', { state: selected.investigated_entity });
    }
  }

  async function NavigateToCaseDetailsPage()
  {
    if(!selected) return;
    const dataset = await telemetryService.RetrieveRawEntityDetailsNeo(selected.investigated_entity) as Record<string, unknown[]>;
    const displayFields = [dataset.entity?.[0], dataset.entity_type?.[0], dataset.host_ip?.[0]];
    dispatch(setData(displayFields));
    navigate('/details');
  }

  const RetrieveEntities = useCallback(async () =>
  {
    const entities = await telemetryService.GetAllEntitiesNeo();
    setEntityList(Array.isArray(entities) ? entities : []);
  }, []);

  const RetrieveUsers = useCallback(async () =>
  {
    const users = await appService.GetUsers();
    setUserList(Array.isArray(users) ? users : []);
  }, []);

  const RetrieveCases = useCallback(async () =>
  {
    const cases = await appService.GetAllCases();
    setCaseList(Array.isArray(cases) ? cases.flat() as CaseRecord[] : []);
  }, []);

  const RetrieveEntityTypes = useCallback(async () =>
  {
    const types = await telemetryService.GetEntityTypes();
    setEntityTypes(types && typeof types === 'object' ? types : {});
  }, []);

  const RetrieveAICommenting = useCallback(async () =>
  {
    const enabled = await appService.GetAICommenting();
    setAICommenting(Boolean(enabled));
  }, []);

  const LoadData = useCallback(async () =>
  {
    await Promise.all([
      RetrieveCases(),
      RetrieveUsers(),
      RetrieveEntities(),
      RetrieveEntityTypes(),
      RetrieveAICommenting()
    ]);
  }, [RetrieveAICommenting, RetrieveCases, RetrieveEntities, RetrieveEntityTypes, RetrieveUsers]);

  async function ToggleAICommenting()
  {
    const enabled = await appService.SetAICommenting(!aiCommenting);
    setAICommenting(Boolean(enabled));
    if(enabled)
    {
      // turning AI on backfills comments onto unprocessed cases; refresh so the badges track it
      RetrieveCases();
      setTimeout(RetrieveCases, 10000);
      setTimeout(RetrieveCases, 30000);
      setTimeout(RetrieveCases, 60000);
    }
  }

  async function CloseCase()
  {
    if(!selected) return;
    await appService.CloseCase(selected.case_id);
    setSelected({ ...selected, resolved_at: new Date().toISOString() });
    await RetrieveCases();
  }

  async function CreateCasesForAllEntities()
  {
    setPopupMessage("Creating Cases");
    setPopupOpen(true);
    const assignedUser = localStorage.getItem('username') || '';
    const result = await appService.CreateCasesForAllEntities(assignedUser);
    await LoadData();
    // agent comments are generated one at a time in the background; keep the badges tracking
    setTimeout(RetrieveCases, 10000);
    setTimeout(RetrieveCases, 30000);
    setTimeout(RetrieveCases, 60000);
    setTimeout(RetrieveCases, 120000);
    setPopupMessage(`Created ${result.created} new case(s)`);
    await Sleep(2000);
    setPopupOpen(false);
  }

  function ClearData()
  {
    setSelectedEntity("");
    setCaseName("");
    setCasePriority("");
    setCaseDescription("");
  }

  useEffect(() =>
  {
    void LoadData();
    if(navigatedEntity)
    {
      setSelectedEntity(navigatedEntity);
      setCaseName(navigatedEntity);
      setIsCaseWizardOpenOpen(true);
    }
  }, [LoadData, navigatedEntity]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>)
  {
    event.preventDefault();
    ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen);
    setPopupMessage("Creating Case");
    setPopupOpen(true);
    const assignedUser = localStorage.getItem('username') || '';
    const createdCase = await appService.CreateCase(selectedEntity, assignedUser, caseName, caseDescription, Number(casePriority || 0)) as CreateCaseResponse | undefined;
    if(createdCase && createdCase.Exists)
    {
      setPopupMessage(`A case already exists for ${selectedEntity}`);
      await Sleep(2000);
      setPopupOpen(false);
      return;
    }
    ClearData();
    for(let i = 0; i < 2; i++)
    {
      LoadData();
    }
    // the agent comment is generated in a background thread server-side; refresh so the status badge flips to processed
    setTimeout(RetrieveCases, 8000);
    setTimeout(RetrieveCases, 20000);
    setPopupMessage("Case Created!");
    await Sleep(2000);
    setPopupOpen(false);
  }

  function Sleep(milliseconds: number)
  {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  function ToggleWindow(isOpen: boolean, setVar: Dispatch<SetStateAction<boolean>>)
  {
    setVar(!isOpen);
  }

  return (
    <div className="relative min-h-screen mt-20 bg-black text-white">
      {/* <h1 className="pl-10 text-3xl font-bold py-4">Casesss</h1> */}
      <div className={`min-h-screen transition-opacity duration-500 ${(!isCaseWizardOpen) ? "opacity-100 pointer-events-auto" : "opacity-40 pointer-events-none"}`}>
        <div className={`flex flex-row flex-wrap min-h-screen max-w-full overflow-x-hidden`}>
          {/* Left Portion */}
          <main className="w-5/6 p-6">
            {(selected != null) ? <CaseDetails selected={selected} setSelected={setSelected} appService={appService} telemetryService={telemetryService} entityTypes={entityTypes} /> : <CasesOverview users={userList} contentSections={caseList} ToggleWindow={ToggleWindow} isUserListOpen={isUserListOpen} setIsUserListOpen={setIsUserListOpen}
            isEntitySelected={isEntitySelected} setIsEntitySelected={setIsEntitySelected} setSelected={SelectCase} entityTypes={entityTypes} />}
          </main>
          {/* Right Portion */}
          <aside className="w-1/6 p-6 mt-10">
            <div className="space-y-4">
              {selected == null && (
                <>
                  <button onClick={() => ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen)} className="bg-black text-white border border-gray-300 w-full py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Create Case</button>
                  <button onClick={CreateCasesForAllEntities} title="Creates a case for every entity that does not already have one" className="bg-black text-white border border-gray-300 w-full py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Case All Entities</button>
                  <button onClick={ToggleAICommenting} title="When on, the AI agent posts a triage comment on new cases and answers comments starting with @agent" className="bg-black text-white border border-gray-300 w-full py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">AI Comments: <span className={aiCommenting ? 'text-purple-400 font-semibold' : 'text-gray-400 font-semibold'}>{aiCommenting ? 'On' : 'Off'}</span></button>
                </>
              )}
              {selected != null && !selected.resolved_at && (
                <button onClick={CloseCase} title="Closes this case; the entity keeps its case history and will not be re-cased" className="bg-black text-white border border-gray-300 w-full py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Close Case</button>
              )}
              {selected != null && (
                <button onClick={() => SelectCase(null)} className="bg-black text-white border border-gray-300 w-full py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Back</button>
              )}
              {selected != null && (
                <div className="text-base break-words">
                  <p className="mt-1 font-medium text-gray-400">Case Name: {selected.casename}</p>
                  <p className="mt-1 font-medium text-gray-400">Entity View: <span onClick={NavigateToCaseDetailsPage} className="text-white cursor-pointer">{selected.investigated_entity}</span></p>
                  <h1 className="mt-1 font-semibold"><span onClick={NavigateToCaseAlertsPage} className="text-white cursor-pointer">Alert View</span></h1>
                  <p className="mt-1 font-medium text-gray-400">Entity Type: {entityTypes[selected.investigated_entity] || ''}</p>
                  <p className="mt-1 font-medium text-gray-400">Status: <span className={selected.resolved_at ? 'text-gray-400' : 'text-green-400'}>{selected.resolved_at ? 'Closed' : 'Open'}</span></p>
                  <p className="mt-1 font-semibold text-gray-400">Priority: {selected.priority}</p>
                  <p className="font-semibold text-gray-400">Description: {selected.description}</p>
                </div>
              )}
              {/* <div className="bg-black text-white p-4 border rounded-lg shadow hover:bg-gray-600">
                <p onClick={() => ToggleWindow(isEntityListOpen, setIsEntityListOpen)} className="cursor-pointer select-none">Select a Case</p>
                <div className={`absolute mt-2 w-fit rounded-md shadow-lg bg-white transform transition-all duration-300 ease-in-out ${isEntityListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div>
                    <ul className="list-inside space-y-4 list-none">
                      {caseList.map((item, index) => (
                        <li key={index} onClick={() => ToggleWindow(isEntityListOpen, setIsEntityListOpen)} className="text-gray-800 cursor-pointer px-4 py-2 hover:bg-gray-200 active:bg-gray-400">
                          <span>{item.casename}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div> */}
              {/* <div className="bg-[#1B1B1B] p-4 rounded-lg shadow text-white">
                <p className="">Chat</p>
                <input id='txtLLMSidebarChat' type="text" className="w-full border border-gray-300 rounded mt-1 p-2 " placeholder="start typing...."/>
                <button className="w-full text-white hover:bg-gray-600 active:bg-gray-800 border border-gray-300 rounded mt-1 p-2">Enter</button>
              </div>
              <div className="bg-[#1B1B1B] p-4 rounded-lg shadow">
                <p className="rounded-lg">Chat History</p>
              </div> */}
            </div>
          </aside>
        </div>
      </div>
      <div className={`flex items-center justify-center transition-opacity duration-500 ${isCaseWizardOpen ? "opacity-100 pointer-events-auto" : "opacity-0 bg-black pointer-events-none"}`}>
        <div className={`fixed inset-0 transition-colors flex items-center justify-center text-black`}>
          <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 transform`}>
            <h2 className="text-xl font-semibold mb-4">Case Setup</h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">
                <span>Case Name</span>
                <input id='txtCaseName' type="text" autoComplete="off" value={caseName} onChange={(e) => {
                      e.currentTarget.setCustomValidity('');
                      setCaseName(e.currentTarget.value);
                    }} className="w-full focus:ring-black border border-gray-300 rounded mt-1 p-2" placeholder="Enter Case Name" required onInvalid={(e) => e.currentTarget.setCustomValidity('Please enter the name for this case')} />
              </label>
              <label className="block mb-4">
                <span>Entity</span>
                <select id='lstEntities' value={selectedEntity} onChange={(e) => { e.currentTarget.setCustomValidity(''); setSelectedEntity(e.currentTarget.value); setCaseName(e.currentTarget.value); }} className="w-full border border-gray-300 rounded mt-1 p-2" required onInvalid={(e) => e.currentTarget.setCustomValidity('Please select an entity from the list')}>
                  <option value="" disabled>Select Entity</option>
                  {entityList.filter((entity) => !caseList.some((caseItem) => caseItem.investigated_entity === entity)).map((entity, index) => (
                    <option key={index} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block mb-2">
                <span>Priority</span>
                <input id='txtPriority' autoComplete="off" type="number" value={casePriority} onChange={(e) => setCasePriority(e.currentTarget.value)} className="w-full focus:ring-black border border-gray-300 rounded mt-1 p-2" placeholder="Enter Case Priority" />
              </label>
              <label className="block mb-2">
                <span>Description</span>
                <textarea id='txtDescription' autoComplete="off" value={caseDescription} className="block w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-black transition-colors duration-200" onChange={(e) => setCaseDescription(e.currentTarget.value)} rows={6} placeholder="Enter Case Description" />
              </label>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen); ClearData(); }} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-black">Create Case</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className={`${popupOpen ? 'visible' : 'invisible'}`}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div role="status">
                <svg aria-hidden="true" className="w-12 h-12 text-gray-200 animate-spin fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" />
                  <path fill="currentFill" d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-gray-700 text-lg font-medium">{popupMessage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
