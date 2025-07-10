import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default class PromptService
{
  constructor() {}

  public DetailsPrompt(question: string, details: any)
  {
    let finalPrompt = `
      Using the following data:" "${details}", answer the following question: "${question}. Answer it as detailed as you can.`;
    return finalPrompt; 
  }

  public DetailsSummaryPrompt(details: any)
  {
    let finalPrompt = `
      Using the following data:" "${details}", can you give me a summary of what I need to priortize for this particular entity"`;
    return finalPrompt; 
  }

  public ThreatStatusSummaryPrompt(details: any)
  {
    let finalPrompt = `
      Give a summary explanation of the data and what the scores mean.  Give a summary report on the data and explain what the nature of the activity is. Be verbose and identify fields you recognize. Explain each field that you recognize and what kind of data it contains. Suggest possible investigative directions.
      ${details}`;
    return finalPrompt;
  }

  public ThreatStatusPrompt(question: string, details: any)
  {
    let finalPrompt = `
      Use this information and based on this data: "${details}"
      Next, answer the following specific question: "${question}"  and repeat my question to me. When answering explain each field that you recognize and what kind of data it contains and suggest possible investigative directions.`;
    return finalPrompt;
  }

  public AlertSummaryPrompt(details: any, specificDetails: any)
  {
    let finalPrompt = `
      Give a summary report on the data and explain what the nature of the activity is. Be verbose and identify fields you recognize. Explain each field that you recognize and what kind of data it contains. Suggest possible investigative directions listed in steps.
      To give further background here's the data specific to this alert: ${JSON.stringify(specificDetails)} and here's the data for the overall entity: ${JSON.stringify(details)}. As previously mentioned give a summary but coorelate the importance between
      the alert and the overall entity`;
    return finalPrompt;
  }

  public AlertPrompt(question: string, details: any, specificDetails: any)
  {
    let finalPrompt = `
      Answer the following question in quotes "${question}" on the data and based on what the nature of the activity is. Be verbose and identify fields you recognize. Answer every part of the question that you recognize and which data relates best to it. Suggest possible investigative directions listed in steps.
      Here are the details for the specific alert: "${JSON.stringify(details)}" and here's the information for the overall entity: "${specificDetails}. Make correlations between the two when answering the question.`;
    return finalPrompt;
  }

  public SummaryOfThreatStatusSummaryPrompt(details: any)
  {
    let finalPrompt = `Can you give me a further summary and set of steps based on this output: ${details}`;
    return finalPrompt;
  }
}