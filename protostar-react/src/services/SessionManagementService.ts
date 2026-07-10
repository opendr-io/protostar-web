import axios from 'axios';
import Config from '../config/config';

export default class SessionManagementService
{
  constructor() {}

  public async Login(username: string, password: string)
  {
    console.log('login attempt');
    let config = new Config();
    await axios.post(config.LoginURL(), 
    {
      'username': username,
      'password': password
    }).then((r: any) => 
    {
      localStorage.setItem('token', r.data.access_token);
      localStorage.setItem('refresh_token', r.data.refresh_token);
    });
  }

  public async RenewSession()
  {
    let config = new Config();
    console.log('RenewSession()');
    let refresh = localStorage.getItem('refresh_token');
    console.log(refresh);
    await axios.post(config.RenewURL(),
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