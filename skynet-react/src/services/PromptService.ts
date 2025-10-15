import validator from 'validator';
import DOMPurify from 'dompurify';
import axios from 'axios';
import Config from '../config/config';
import SessionManagementService from './SessionManagementService';

export default class PromptService
{
  constructor() {}
  public async DetailsPrompt(question: string, details: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'DetailsPrompt',
        'details': details,
        'question': question,
        'specificDetails': ''
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `Can you explain the security risks and steps for mitigation using the following data:" "${details}", answer the 
    // following question: "${question}. Answer it as detailed as you can. At the beginning of the response place 
    // the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    // place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    // to the point.`;
    // return finalPrompt; 
  }

  public async DetailsSummaryPrompt(details: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'DetailsSummaryPrompt',
        'details': details,
        'question': '',
        'specificDetails': ''
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `Can you explain the security risks and steps for mitigation using the following data:" "${details}", can you give me a summary of 
    // what I need to priortize for this particular entity. Answer it as detailed as you can. At the beginning of the response place 
    // the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    // place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    // to the point.`;
    // return finalPrompt;
  }

  public async ThreatStatusSummaryPrompt(details: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'ThreatStatusSummaryPrompt',
        'details': details,
        'question': '',
        'specificDetails': ''
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `Can you explain the security risks and steps for mitigation using a summary explanation of the data and what the scores mean. Give a 
    // summary report on the data and explain what the nature of the activity is. Be verbose and identify fields you recognize. Explain each 
    // field that you recognize and what kind of data it contains. Suggest possible investigative directions. ${details}. At the beginning of the response place 
    // the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    // place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    // to the point.`;
    // return finalPrompt;
  }

  public async ThreatStatusPrompt(question: string, details: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'ThreatStatusPrompt',
        'details': details,
        'question': question,
        'specificDetails': ''
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      // console.log(response.data);
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `Can you explain the security risks and steps for mitigation using this information and based on this data: "${details}" Next, answer 
    // the following specific question: "${question}"  and repeat my question to me. When answering explain each field that
    // you recognize and what kind of data it contains and suggest possible investigative directions. Answer it as best as you can. At the beginning of the response place 
    // the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    // place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    // to the point.`;
    // return finalPrompt;
  }

  public async AlertSummaryPrompt(details: any, specificDetails: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'AlertSummaryPrompt',
        'details': details,
        'question': JSON.stringify(details),
        'specificDetails': JSON.stringify(specificDetails)
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `Can you explain the security risks and steps for mitigation using the data specific to this alert: ${} and here's the data for 
    // the overall entity: ${JSON.stringify(details)}. As previously mentioned give a summary but coorelate the importance between the alert and the overall entity. At the beginning of the response place 
    // the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    // place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    // to the point.`;
    // return finalPrompt;
  }

  public async AlertPrompt(question: string, details: any, specificDetails: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'AlertPrompt',
        'details': JSON.stringify(details),
        'question': question,
        'specificDetails': specificDetails
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `Answer the following question in quotes "${question}" on the data and based on what the nature of the activity is. Explain the cybersecurity risks.
    // Be verbose and identify fields you recognize. Answer every part of the question that you recognize and which data relates best to it. Suggest possible investigative directions listed in steps. Here
    // are the details for the specific alert: "${JSON.stringify(details)}" and here's the information for the overall entity: "${specificDetails}. Make correlations between 
    // the two when answering the question. Answer it as best as you can. At the beginning of the response place 
    // the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    // place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    // to the point.`;
    // return finalPrompt;
  }

  public async SummaryOfThreatStatusSummaryPrompt(details: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'SummaryOfThreatStatusSummaryPrompt',
        'details': details,
        'question': '',
        'specificDetails': ''
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `Can you give me a further summary and explain the security risks and mitigation steps based on this output: ${details}. Answer it as best as you can. At the beginning 
    // of the response place the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:"`;
    // return finalPrompt;
  }

  public async AgentCaseCommentPrompt(details: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let config = new Config();
      let token = localStorage.getItem('token');
      let finalPrompt = await axios.post(config.GetFullyFormedPromptURL(),
      {
        'method': 'AgentCaseCommentPrompt',
        'details': details,
        'question': '',
        'specificDetails': ''
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return finalPrompt.data;
    } 
    catch(error: any)
    {
      sms.Logout();
      window.location.href = '/login';
    }
    // let finalPrompt = `
    // Here are some key terms to note for it's importance when making the summary:
    //   1. detection_type: is the process of analyzing a security ecosystem at the holistic level to find malicious users, abnormal activity and anything that could compromise a network. Detection Type is built on threat
    //     intelligence, which involves tools that are strategic, tactical and operational. Highly evasive cyber threats are the main focus of threat detection and response tools.
    //   2. mitre_tactic: Represent the "why" of an ATT&CK technique or sub-technique. It is the adversary's tactical goal: the reason for performing an action. For example, an adversary may want to achieve credential access. Each representing a
    //     stage in an adversary's objective, such as Initial Access, Privilege Escalation, or Exfiltration. Each technique is mapped to procedures, detection opportunities, and mitigations.
    //   3. entity: An individual person, organization, device, or process that's being investigated.
    //   4. timestamp: When the action took place.
    //   5. entity_type: Is a grouping of the entities that match a set of filter conditions.
    //   6. severity: Is a categorization of the risk and urgency of a vulnerability and the classification of alarm criticality within a monitoring system.
    // Based on the terms above write the summary and make it clear, concise, and brief. Make sure the summary is no longer than four sentences to a paragraph long. Here's the entity to be investigated: ${details}`;
    // return finalPrompt;
  }
}