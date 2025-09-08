import axios from 'axios';
import Config from '../config/config';
import SessionManagementService from './SessionManagementService';

export default class AppService
{
  private config: Config;
  constructor()
  {
    this.config = new Config();
  }

  async GetUsers()
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.GetUsersURL(), 
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
      console.log('An error has been thrown');
      new SessionManagementService().Logout();
      window.location.href = '/login';
      console.log(error);
    }
  }

  async CreateCase(entity: string, assignedUser: string, caseName: string, caseDescription: string, casePriority: number)
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.CreateCaseURL(), 
      {
        'entity': entity,
        'username': assignedUser,
        'casename': caseName,
        'description': caseDescription,
        'priority': casePriority
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
      console.log('An error has been thrown');
      new SessionManagementService().Logout();
      window.location.href = '/login';
      console.log(error);
    }
  }

  async GetAllCases()
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.GetAllCasesURL(),
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
      console.log('An error has been thrown');
      new SessionManagementService().Logout();
      window.location.href = '/login';
      console.log(error);
    }
  }
}