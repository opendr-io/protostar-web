import axios from 'axios';
import validator from 'validator';
import DOMPurify from 'dompurify';
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
      entity = DOMPurify.sanitize(entity);
      assignedUser = DOMPurify.sanitize(assignedUser);
      caseName = DOMPurify.sanitize(caseName);
      caseDescription = DOMPurify.sanitize(caseDescription);
      casePriority = Number(DOMPurify.sanitize(String(casePriority)));
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

  async PostComment(user: string, userComment: string, selectedCase: number)
  {
    try
    {
      selectedCase = Number(DOMPurify.sanitize(String(selectedCase)));
      userComment = DOMPurify.sanitize(userComment);
      user = DOMPurify.sanitize(user);
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.PostCaseCommentURL(),
      {
        'case': selectedCase,
        'user': user,
        'comment': userComment
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

  async LoadCaseComments(selectedCase: number)
  {
    try
    {
      selectedCase = Number(DOMPurify.sanitize(String(selectedCase)));
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.LoadCaseCommentsURL(),
      {
        'case': selectedCase
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
}