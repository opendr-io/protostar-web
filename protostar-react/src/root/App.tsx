import { useState } from 'react'
import { Menu } from '../components/Menu'
import axios from 'axios';
import SessionManagementService from '../services/SessionManagementService';

function App()
{
  const sms = new SessionManagementService();
  axios.interceptors.request.use(
    async function(config: any) 
    {
      const token = localStorage.getItem('token');
      if(token)
      {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    async function(error) 
    {
      // Do something with request error
      return Promise.reject(error);
    }
  );

  // Add a response interceptor
  axios.interceptors.response.use(
    function(response) 
    {
      // Any status code within 2xx range triggers this function
      return response;
    },
    async function (error) 
    {
      // window.location.href = '/login';
      // console.log('Token expired. Attempting to renew.');
      // Any status codes outside 2xx range trigger this function
      return Promise.reject(error);
    }
  );
  return (
    <div className='bg-black overflow-y-scroll max-h-screen text-white'>
      <Menu />
    </div>
  )
}

export default App