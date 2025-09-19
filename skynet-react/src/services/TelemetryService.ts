// import Anthropic from "@anthropic-ai/sdk";
import axios from 'axios';
import validator from 'validator';
import DOMPurify from 'dompurify';
import Config from '../config/config';
import SessionManagementService from './SessionManagementService';

export default class TelemetryService
{
  private config: Config;
  constructor()
  {
    this.config = new Config();
  }

  async RetrieveGraphData(view: any)
  {
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      view = DOMPurify.sanitize(view);
      const r = await axios.post(this.config.ShowGraphURL(),
      {
        'view': view
      }, 
      {
        headers: 
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return r.data;
    }
    catch(error) 
    {
      console.log('An error has been thrown');
      sms.Logout();
      window.location.href = '/login';
      console.log(error); 
    }
  }

  async GetEntitiesNeo()
  {
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      const r = await axios.get(this.config.EntitiesNeoURL(), 
      {
        headers: 
        {
          Authorization: `Bearer ${token}`
        }
      });
      return r.data;
    }
    catch(error)
    {
      console.error('Error: ' + error);
      sms.Logout();
      window.location.href = '/login';
    }
  }

  async RetrieveEntityDetailsNeo(entity: any)
  {
    try
    {
      let token = localStorage.getItem('token');
      entity = DOMPurify.sanitize(entity);
      const response = await axios.post(this.config.EntityDetailsNeoURL(), 
      {
        'entity': entity
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
      console.error('Error:', error);
      new SessionManagementService().Logout();
      window.location.href = '/login';
    }
  }

  async RetrieveRawEntityDetailsNeo(entity: any)
  {
    try
    {
      entity = DOMPurify.sanitize(entity);
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.RawEntityDetailsURL(), 
      {
        'entity': entity
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
      console.error('Error:', error);
      new SessionManagementService().Logout();
      window.location.href = '/login';
    }
  }

  async GetAllEntitiesNeo()
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.GetAllEntitiesURL(), 
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
      console.error('Error:', error);
      new SessionManagementService().Logout();
      window.location.href = '/login';
    }
  }
}