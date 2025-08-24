import React from "react";
import { useEffect, useState } from "react";

export function Cases()
{
  return (
    <div className="relative min-h-screen mt-20">
      <h1 className="pl-10 text-3xl font-bold pt-4">Cases</h1>
      <div className="min-h-screen bg-gray-100 mt-4">
      {/* Container with three columns */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Sidebar */}
        <aside className="w-full lg:w-1/4 bg-blue-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Left Sidebar</h2>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600">Sidebar content goes here</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600">Navigation or widgets</p>
            </div>
          </div>
        </aside>

        {/* Main Content (Center - Largest) */}
        <main className="w-full lg:w-1/2 bg-white p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Main Content</h1>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Content Section 1</h3>
              <p className="text-gray-700">
                This is the main content area. It takes up the most space in the layout.
                You can add your primary content, articles, posts, or any main information here.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Content Section 2</h3>
              <p className="text-gray-700">
                Additional content sections can be added here. The center column is designed
                to be the focal point of your page layout.
              </p>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-1/4 bg-green-100 p-6">
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