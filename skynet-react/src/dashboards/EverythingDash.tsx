import React from "react";
import { useEffect, useState } from "react";
import Config from "../config/config";

export function EverythingDash()
{
  const config = new Config();
  return (
    <div className="min-h-screen mx-10 text-3xl font-bold pt-4 bg-black text-white mt-20">
      <iframe className="mt-4 w-full h-[88vh] rounded-md" src={`${config.ServerURL()}:3000/view1`} />
    </div>
  )
}