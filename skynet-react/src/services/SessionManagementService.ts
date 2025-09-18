import axios from 'axios';
import validator from 'validator';
import DOMPurify from 'dompurify';
import Config from '../config/config';
export default class SessionManagementService
{
  private config: Config;
  constructor() 
  {
    this.config = new Config();
  }

  public async Login(username: string, password: string)
  {
    console.log('login attempt');
    await axios.post(this.config.LoginURL(), 
    {
      'username': username,
      'password': password
    }).then((r: any) => 
    {
      localStorage.setItem('token', r.data.access_token);
      localStorage.setItem('refresh_token', r.data.refresh_token);
      localStorage.setItem('username', username);
    });
  }

  public async RenewSession()
  {
    console.log('RenewSession()');
    let refresh = localStorage.getItem('refresh_token');
    console.log(refresh);
    await axios.post(this.config.RenewURL(),
    {
      headers: 
      {
        'Authorization': `Bearer ${refresh}`
      }
    }).then((r: any) => 
    {
      console.log('refreshing token');
      console.log(r);
      localStorage.setItem('token', r.data.access_token);
    });
  }

  public async Logout()
  {
    let config = new Config();
    let token = localStorage.getItem('token');
    let refresh = localStorage.getItem('refresh_token');
    localStorage.clear();
    await axios.post(config.LogoutURL(), 
    {
      'token': token,
      'refresh': refresh
    },
    {
      headers: 
      {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}