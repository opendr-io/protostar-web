import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";

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
    <div className="relative min-h-screen mt-20">
      <h1 className="pl-10 text-3xl font-bold py-4">Cases</h1>
      <div className={`min-h-screen bg-gray-100 transition-opacity duration-500 ${(!isCaseWizardOpen) && (!isEntitySelected) ? "opacity-100 pointer-events-auto" : "opacity-40 pointer-events-none"}`}>
        {/* Container with three columns */}
        <div className={`flex flex-row flex-wrap min-h-screen max-w-full overflow-x-hidden`}>
          {/* Left Sidebar */}
          <aside className={`w-1/6 bg-blue-100 p-6 transition-opacity`}>
            <button onClick={() => ToggleWindow(isCaseWizardOpen, setIsCaseWizardOpenOpen)} className="cursor-pointer hover:bg-gray-200 active:bg-gray-400 text-black bg-white px-8 py-2 shadow rounded-lg">Create Case</button>
            <div className="space-y-4 my-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Assignees</h2>
              {/* <div className="bg-white p-4 rounded-lg shadow">
              </div> */}
              <div className="bg-white p-4 rounded-lg shadow hover:bg-gray-200">
                <p className="text-black cursor-pointer select-none" onClick={() => ToggleWindow(isUserListOpen, setIsUserListOpen)}>List of Assignees</p>
                <div className={`absolute mt-2 w-fit rounded-md shadow-lg bg-white transform transition-all duration-300 ease-in-out ${isUserListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div>
                    <ul className="list-inside space-y-4 list-none">
                      {users.map((item, index) => (
                        <li key={index} onClick={() => ToggleWindow(isUserListOpen, setIsUserListOpen)} className="text-gray-800 cursor-pointer px-4 py-2 hover:bg-gray-200 active:bg-gray-400">
                          <span>{item.user}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="w-2/3 bg-white p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cases</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
              {contentSections.map(({ id, title, text }) => (
                <div key={id} className="bg-gray-50 text-gray-800 rounded-lg shadow cursor-pointer aspect-square p-6 flex flex-col" onClick={() => {setSelected({ title, text }); ToggleWindow(isEntitySelected, setIsEntitySelected)}}>
                  <h3 className="text-lg text-black font-semibold mb-3">{title}</h3>
                  <p className="text-gray-700 line-clamp-4">{text}</p>
                </div>
              ))}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="w-1/6 bg-green-100 p-6">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow hover:bg-gray-200">
                <p onClick={() => ToggleWindow(isEntityListOpen, setIsEntityListOpen)} className="text-black cursor-pointer select-none">Select a Case</p>
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
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600">Chat</p>
                <input type="text" className="w-full text-black border border-gray-300 rounded mt-1 p-2" placeholder="start typing...."/>
                <button className="w-full text-black bg-white hover:bg-gray-200 active:bg-gray-400 border border-gray-300 rounded mt-1 p-2">Enter</button>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 rounded-lg">Chat History</p>
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
      <div className={`flex items-center justify-center transition-opacity duration-500 ${isEntitySelected ? "opacity-100 pointer-events-auto" : "opacity-0 bg-black pointer-events-none"}`}>
        {selected && (
          <div className={`fixed inset-0 transition-colors flex items-center justify-center text-black`}>
            <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 transform`}>
              <h2 className="text-xl font-semibold mb-4">Case {selected.title}</h2>
              <form>
                <label className="block mb-4">
                  <span className="font-semibold">Entity</span>
                </label>
                <label className="block mb-2">
                  <span className="font-semibold">Assignee</span>
                </label>
                <label className="block mb-4">
                  <span className="font-semibold">Evidence</span>
                  <p className="text-gray-800 whitespace-pre-line ml-1">{selected.text}</p>
                </label>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() =>  {setSelected(null); ToggleWindow(isEntitySelected, setIsEntitySelected)}} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Close</button>
                </div>
                <div className="bg-white p-4 rounded-lg shadow my-4">
                  <p className="text-gray-600">Chat</p>
                  <input type="text" className="w-full text-black border border-gray-300 rounded mt-1 p-2" placeholder="start typing...."/>
                  <button className="w-full text-black bg-white hover:bg-gray-200 active:bg-gray-400 border border-gray-300 rounded mt-1 p-2">Enter</button>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-gray-600 rounded-lg">Chat History</p>
                </div>

              </form>
            </div>
        </div>
      )}
      </div>
    </div>
  )
}