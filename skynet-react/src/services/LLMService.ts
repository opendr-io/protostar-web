// import Anthropic from "@anthropic-ai/sdk";
import axios from 'axios';
import Config from '../config/config';
import { errorUtils } from './ErrorHandlingService';
import SessionManagementService from './SessionManagementService';

export default class LLMService
{  
  async AskClaude(question: any)
  {
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let finalQuestion = question;
      let token = localStorage.getItem('token');
      let response = await axios.post(config.AskLLMURL(),
      {
        'question': finalQuestion
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
  }

  async AskChatGPT(question: any)
  {
  }

  async AskLocalLLM(question: any)
  {
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let finalQuestion = question;
      let token = localStorage.getItem('token');
      const response = await axios.post(config.AskLocalLLMURL(),
      {
        'question': finalQuestion
      },
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    }
    catch(error) 
    {
      sms.Logout();
      window.location.href = '/login';
    }
  }
  
  async UseLocalLLM(llm: any)
  {
    let config = new Config();
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(config.UseLocalLLMURL(),
      {
        'uselocalllm': llm
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    }
    catch(error) { console.error('Error:', error); }
  }
}