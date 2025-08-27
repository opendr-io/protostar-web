import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";
import { CasesOverview } from "./CasesOverview.tsx";
import { CaseDetails } from "./CaseDetails.tsx";

export function Cases()
{
  const [isCaseWizardOpen, setIsCaseWizardOpenOpen] = useState(false);
  const [isEntityListOpen, setIsEntityListOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isEntitySelected, setIsEntitySelected] = useState(false);
  const [selected, setSelected] = useState(null);
  const contentSections = [
    {
      id: 1,
      title: "Case 1",
      text: `This is the main content area. It now takes up even more space in the layout (60% of the width).
            You can add your primary content, articles, posts, or any main information here.
            The wider layout gives you more room for content presentation.`,
    },
    {
      id: 2,
      title: "Case 2",
      text: `Additional content sections can be added here. The center column is now significantly
            wider than the sidebars, making it the clear focal point of your page layout.`,
    },
    {
      id: 3,
      title: "Case 3",
      text: `With the extra width, you have more space for images, tables, or other content
            that benefits from a wider display area.`,
    },

    {
      id: 4,
      title: "All",
      text: `With the extra width, you have more space for images, tables, or other content
            that benefits from a wider display area.`,
    },
  ];

  const users = [
    {
      id: 1,
      user: "User 1",
    },
    {
      id: 2,
      user: "User 2"
    },
    {
      id: 3,
      user: "User 3",
    },
  ];

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
            {(selected != null) ? <CaseDetails selected={selected} setSelected={setSelected} /> : <CasesOverview users={users} contentSections={contentSections} ToggleWindow={ToggleWindow} isUserListOpen={isUserListOpen} setIsUserListOpen={setIsUserListOpen} 
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
                      {contentSections.map((item, index) => (
                        <li key={index} onClick={() => ToggleWindow(isEntityListOpen, setIsEntityListOpen)} className="text-gray-800 cursor-pointer px-4 py-2 hover:bg-gray-200 active:bg-gray-400">
                          <span>{item.title}</span>
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
            <form>
              <label className="block mb-2">
                <span>Assignee</span>
                <input type="text" className="w-full border border-gray-300 rounded mt-1 p-2" placeholder="Enter the assignee for this case"/>
              </label>
              <label className="block mb-4">
                <span>Entity</span>
                <input type="email" className="w-full border border-gray-300 rounded mt-1 p-2" placeholder="Select Entity"/>
              </label>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Case</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}