import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
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
}

export function CasesOverview({ users, contentSections, ToggleWindow, isUserListOpen, setIsUserListOpen, isEntitySelected, setIsEntitySelected, setSelected } : CasesOverviewProps)
{
  return (
    <main>
      <div onClick={() => ToggleWindow(isUserListOpen, setIsUserListOpen)} className="bg-black text-white mx-4 border border-gray-300 mt-4 py-2 p-4 rounded-md hover:bg-gray-600 font-normal cursor-pointer">
        <p className="cursor-pointer select-none">Assignee</p>
        <div className={`absolute mt-2 w-fit rounded-md shadow-lg bg-white transform transition-all duration-300 ease-in-out ${isUserListOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div>
            <ul className="list-inside space-y-4 list-none">
              {users.map((item: any, index: any) => (
                <li key={index} onClick={() => ToggleWindow(isUserListOpen, setIsUserListOpen)} className="text-gray-800 cursor-pointer px-4 py-2 hover:bg-gray-200 active:bg-gray-400">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
        {contentSections.map(({ id, title, text }) => (
          <div key={id} className="bg-[#1B1B1B] text-white rounded-lg shadow cursor-pointer aspect-square p-6 flex flex-col" onClick={() => {setSelected({ title, text }); ToggleWindow(isEntitySelected, setIsEntitySelected)}}>
            <h3 className="text-lg font-semibold mb-3">{title}</h3>
            <p className="line-clamp-4">{text}</p>
          </div>
        ))}
      </div>
    </main>
  )
}