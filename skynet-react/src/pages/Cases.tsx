import { createBrowserRouter, data, RouterProvider, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
// import Papa, { parse } from 'papaparse';
import LLMService from '../services/LLMService.ts';
import TelemetryService from "../services/TelemetryService.ts";
import PromptService from "../services/PromptService.ts";
import HelpTextService from "../services/HelpTextService.ts";

export function Cases()
{
  const [llmQuestion, setLLMQuestion] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [entities, setEntities] = useState<any>(null);
  const [entityCounter, setEntityCounter] = useState<number>(0)
  const [entityDetails, setEntityDetails] = useState<any>(null);
  const [llmOutput, setLLMOutput] = useState('');

  async function FetchCases()
  {
  }

  useEffect(() =>
  {
    FetchCases();
  });
}