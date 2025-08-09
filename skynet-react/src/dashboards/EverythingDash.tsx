import React, { useEffect, useState } from "react";
import Config from "../config/config";

export function EverythingDash()
{
  const config = new Config();
  return (
    <div className="flex flex-col min-h-screen mx-10 bg-black text-white mt-[48px]">
      <div className="flex-1">
        <iframe 
          className="w-full h-full rounded-md"
          src={`${config.ServerURL()}:3000/view1`} 
          style={{
            height: `calc(100vh - ${document.querySelector('.h-12')?.offsetHeight || 48}px)`
          }}
        />
      </div>
    </div>
  )
}