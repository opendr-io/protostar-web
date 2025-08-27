import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";

interface CaseDetailsProps 
{
  selected: any[];
  setSelected: any;
}

export function CaseDetails({ selected, setSelected } : CaseDetailsProps)
{
  function handleGoBack() 
  {
    setSelected(null);
  }

  return (
    <main className="mx-5">
      <button onClick={handleGoBack} className="bg-black text-white border border-gray-300 mt-4 w-24 h-10 py-2 rounded-md hover:bg-gray-600 font-normal cursor-pointer">Back</button>
      <div className="mx-2 mt-4">
        <h1 className="text-xl font-semibold">Case Details</h1>
        <div className={`flex items-center justify-center transition-opacity duration-500 `}>
          {selected && (
            <div className={`flex items-center justify-center text-black`}>
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
    </main>
  )
}