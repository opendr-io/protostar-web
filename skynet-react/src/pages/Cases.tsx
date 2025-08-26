import { createBrowserRouter, data, RouterProvider, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from "react-redux";
import LLMService from '../services/LLMService.ts';
import PromptService from "../services/PromptService.ts";
import TelemetryService from "../services/TelemetryService.ts";
import HelpTextService from "../services/HelpTextService.ts";

export function Cases()
{
  return (
    <div className="relative min-h-screen mt-20">
      <h1 className="pl-10 text-3xl font-bold py-4">Cases</h1>
      <div className="min-h-screen bg-gray-100">
        {/* Container with three columns */}
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Sidebar */}
          <aside className="w-full lg:w-1/5 bg-blue-100 p-6">
            <button className="cursor-pointer hover:bg-gray-200 active:bg-gray-400 text-black bg-white px-8 py-2 shadow rounded-lg">Create Case</button>
            <div className="space-y-4 my-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Assignees</h2>
              {/* <div className="bg-white p-4 rounded-lg shadow">
              </div> */}
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600">Navigation or widgets</p>
              </div>
            </div>
          </aside>

          {/* Main Content (Center - Widest) */}
          <main className="w-full lg:w-3/5 bg-white p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cases</h1>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Content Section 1</h3>
                <p className="text-gray-700">
                  This is the main content area. It now takes up even more space in the layout (60% of the width).
                  You can add your primary content, articles, posts, or any main information here.
                  The wider layout gives you more room for content presentation.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Content Section 2</h3>
                <p className="text-gray-700">
                  Additional content sections can be added here. The center column is now significantly
                  wider than the sidebars, making it the clear focal point of your page layout.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Content Section 3</h3>
                <p className="text-gray-700">
                  With the extra width, you have more space for images, tables, or other content
                  that benefits from a wider display area.
                </p>
              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-1/5 bg-green-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Right Sidebar</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600">Additional info</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600">Ads or related content</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}