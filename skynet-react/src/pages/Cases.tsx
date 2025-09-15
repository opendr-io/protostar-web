import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";
import AppService from "../services/AppService.ts";
import { CasesOverview } from "./CasesOverview.tsx";
import { CaseDetails } from "./CaseDetails.tsx";

export function Cases()
{
  const [isCaseWizardOpen, setIsCaseWizardOpenOpen] = useState(false);
  const [isEntityListOpen, setIsEntityListOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isEntitySelected, setIsEntitySelected] = useState(false);  
  const [selected, setSelected] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [userAssigned, setUserAssigned] = useState("");
  const [casePriority, setCasePriority] = useState(0);
  const [caseName, setCaseName] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [caseList, setCaseList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [entityList, setEntityList] = useState([]);

  let ts = new TelemetryService();
  let llm = new LLMService();
  let hts = new HelpTextService();
  let ps = new PromptService();
  let as = new AppService();

  useEffect(() =>
  {
    async function RetrieveEntities()
    {
      let e = await ts.GetAllEntitiesNeo();
      setEntityList(e);
    }

    async function RetrieveUsers()
    {
      let u = await as.GetUsers();
      setUserList(u);
    }

    async function RetrieveCases() 
    {
      let c = await as.GetAllCases();
      setCaseList(c.flat());
    }
    RetrieveCases();
    RetrieveUsers();
    RetrieveEntities();
  }, []);

  function handleSubmit(event: any)
  {
    event.preventDefault();
    let assginedUser:any = localStorage.getItem('username');
    as.CreateCase(selectedEntity, assginedUser, caseName, caseDescription, casePriority);
    setSelectedEntity("");
    setUserAssigned("");
    setUserAssigned("");
    setCaseName("");
    ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen);
  };

  function ToggleWindow(isOpen: boolean, setVar: React.Dispatch<React.SetStateAction<boolean>>)
  {
    setVar(!isOpen);
  }

  return (
    <div className="relative min-h-screen mt-20 bg-black text-white">
      <h1 className="pl-10 text-3xl font-bold py-4">Cases</h1>
      <div className={`min-h-screen transition-opacity duration-500 ${(!isCaseWizardOpen) ? "opacity-100 pointer-events-auto" : "opacity-40 pointer-events-none"}`}>
        <div className={`flex flex-row flex-wrap min-h-screen max-w-full overflow-x-hidden`}>
          {/* Left Portion */}
          <main className="w-5/6 p-6">
            {(selected != null) ? <CaseDetails selected={selected} setSelected={setSelected} /> : <CasesOverview users={userList} contentSections={caseList} ToggleWindow={ToggleWindow} isUserListOpen={isUserListOpen} setIsUserListOpen={setIsUserListOpen} 
            isEntitySelected={isEntitySelected} setIsEntitySelected={setIsEntitySelected} setSelected={setSelected} />}
          </main>
          {/* Right Portion */}
          <aside className="w-1/6 p-6">
            <div className="space-y-4">
              <button onClick={() => ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen)} className="bg-black text-white border border-gray-300 mt-4 w-full py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Create Case</button>
              <div className="bg-black text-white p-4 border rounded-lg shadow hover:bg-gray-600">
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
              </div>
              <div className="bg-[#1B1B1B] p-4 rounded-lg shadow text-white">
                <p className="">Chat</p>
                <input type="text" className="w-full border border-gray-300 rounded mt-1 p-2 " placeholder="start typing...."/>
                <button className="w-full text-white hover:bg-gray-600 active:bg-gray-800 border border-gray-300 rounded mt-1 p-2">Enter</button>
              </div>
              <div className="bg-[#1B1B1B] p-4 rounded-lg shadow">
                <p className="rounded-lg">Chat History</p>
              </div>
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
                <input type="text" onChange={(e) => setCaseName(e.target.value)} className="w-full focus:ring-black border border-gray-300 rounded mt-1 p-2" placeholder="Enter Case Name" required onInvalid={(e) => e.target.setCustomValidity('Please enter the name for this case')} />
              </label>
              <label className="block mb-4">
                <span>Entity</span>
                <select onChange={(e) => setSelectedEntity(e.target.value)} className="w-full border border-gray-300 rounded mt-1 p-2" required onInvalid={(e) => e.target.setCustomValidity('Please select an entity from the list')}>
                  <option disabled selected>Select Entity</option>
                  {entityList.map((entity, index) => (
                    <option key={index} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block mb-2">
                <span>Priority</span>
                <input type="number" onChange={(e) => setCasePriority(Number(e.target.value))} className="w-full focus:ring-black border border-gray-300 rounded mt-1 p-2" placeholder="Enter Case Name" />
              </label>
              <label className="block mb-2">
                <span>Desription</span>
                <textarea className="block w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-black transition-colors duration-200" onChange={(e) => setCaseDescription(e.target.value)} rows={6} placeholder="Enter Case Description" />
              </label>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen); setSelectedEntity(""); setUserAssigned(""); setCaseName(""); }} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-black">Create Case</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}