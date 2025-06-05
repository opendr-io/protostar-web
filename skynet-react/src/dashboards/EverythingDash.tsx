import React from "react";
import { useEffect, useState } from "react";

export function EverythingDash()
{
  return (
    <div className="min-h-screen mx-10 text-3xl font-bold pt-4 bg-black text-white mt-20">
      <h1>Everything Dash</h1>
      <iframe className="mt-4 w-full h-[88vh] rounded-md" src="http://localhost:3000/view1" />
    </div>
  )
}