import React from "react";
import { useEffect, useState } from "react";

export function Settings()
{
  const [isChecked, setIsChecked] = useState(false);
  const darkMode = (event) => 
  {
    if(event.target.checked)
    {
      localStorage.setItem('darkmode', 'true');
    }
    else
    {
      localStorage.setItem('darkmode', 'false');
    }
  };
  return (
    <div className="mx-10 py-4 min-h-screen mt-20">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="mx-4">
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-1">Appearance</h2>
          <label className="mx-2" htmlFor="darkmode">Dark Mode</label>
          <input className="mx-2" type="checkbox" name="" id="darkmode" />
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-1">AI</h2>
          <label className="mx-2" htmlFor="localllms">Local LLMs</label>
          <input className="mx-2" type="checkbox" name="" id="localllms" checked={isChecked} onChange={darkMode} />
        </div>
      </div>
    </div>
  )
}