import axios from 'axios';
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

  // no logout-on-error here: explanation persistence is an enhancement, the
  // Alerts page must keep working when these calls fail
  async SaveAlertExplanation(guid: string, entity: string, explanation: string)
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.SaveAlertExplanationURL(),
      {
        'guid': guid,
        'entity': entity,
        'explanation': explanation
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
      console.log('Saving the alert explanation failed', error);
      return null;
    }
  }

  async GetAlertExplanations(guids: string[])
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.GetAlertExplanationsURL(),
      {
        'guids': guids
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
      console.log('Loading alert explanations failed', error);
      return null;
    }
  }

  async GetAllCases()
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.GetAllCasesURL(),
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

  async CloseCase(selectedCase: number)
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.CloseCaseURL(),
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

  async CreateCasesForAllEntities(assignedUser: string)
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.CreateCasesForAllEntitiesURL(),
      {
        'username': assignedUser
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

  async GetAICommenting()
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.GetAICommentingURL(),
      {
      },
      {
        headers:
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.aicommenting;
    }
    catch(error)
    {
      console.log('An error has been thrown');
      new SessionManagementService().Logout();
      window.location.href = '/login';
      console.log(error);
    }
  }

  async SetAICommenting(enabled: boolean)
  {
    try
    {
      let token = localStorage.getItem('token');
      const response = await axios.post(this.config.SetAICommentingURL(),
      {
        'enabled': enabled
      },
      {
        headers:
        {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.aicommenting;
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
    selectedCase = Number(DOMPurify.sanitize(String(selectedCase)));
    userComment = DOMPurify.sanitize(userComment);
    user = DOMPurify.sanitize(user);
    let token = localStorage.getItem('token');
    // no logout on failure: the caller keeps the draft and shows the error instead
    for(let attempt = 0; attempt < 3; attempt++)
    {
      try
      {
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
        console.log(error);
        if(attempt < 2)
        {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    return null;
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