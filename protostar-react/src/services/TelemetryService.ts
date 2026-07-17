// import Anthropic from "@anthropic-ai/sdk";
import axios from 'axios';
import Config from '../config/config';
import SessionManagementService from './SessionManagementService';

export default class TelemetryService
{
  constructor()
  {
  }

  async RetrieveGraphData(view: any)
  {
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      const r = await axios.post(config.ShowGraphURL(),
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
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      const r = await axios.get(config.EntitiesNeoURL(), 
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
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(config.EntityDetailsNeoURL(), 
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
      sms.Logout();
      window.location.href = '/login';
    }
  }

  async RetrieveRawEntityDetailsNeo(entity: any)
  {
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(config.RawEntityDetailsURL(), 
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
      sms.Logout();
      window.location.href = '/login';
    }
  }

  // no logout-on-error here: a failed search must not end the session, the page
  // shows an error state and the user keeps working
  async SearchAlerts(term: any)
  {
    let config = new Config();
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(config.SearchAlertsURL(),
      {
        'term': term
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
      console.error('Alert search failed', error);
      return null;
    }
  }

  async GetEntityTypes()
  {
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(config.GetEntityTypesURL(),
      {
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
      sms.Logout();
      window.location.href = '/login';
    }
  }

  async GetAllEntitiesNeo()
  {
    let config = new Config();
    let sms = new SessionManagementService();
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(config.GetAllEntitiesURL(),
      {
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
      sms.Logout();
      window.location.href = '/login';
    }
  }
}