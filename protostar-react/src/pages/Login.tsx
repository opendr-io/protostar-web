import { useState } from 'react';
import { Outlet, useNavigate } from "react-router-dom";
import { createBrowserRouter, RouterProvider, useRoutes } from "react-router-dom";
import SessionManagementService from '../services/SessionManagementService';

export function Login()
{
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  let sms = new SessionManagementService();

  const navigate = useNavigate();

  const handleLoginForm = async (event: any) =>
  {
    event.preventDefault();
    await sms.Login(username, password);
    let t = localStorage.getItem('token');
    if(t)
    {
      navigate('/summary');
      console.log('logged in!!!');
      window.location.reload();
    }
  }

  return (
    <div className='min-h-screen mt-20'>
      <form onSubmit={handleLoginForm}>
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center w-full max-w-md p-8 rounded-lg shadow-lg">
            <h1 className="w-full font-mono font-semibold text-left">Welcome to Protostar</h1>
            <div className="w-full my-5 px-4">
              <label className="text-left block w-full" htmlFor="username">Enter Username</label>
              <input className="rounded-md w-full border p-2" id="username" autoComplete="off" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              <label className="text-left block w-full mt-4" htmlFor="password">Enter Password</label>
              <input className="rounded-md w-full border p-2" id="password" autoComplete="off" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {/* <label className="text-right block w-full mt-4 cursor-pointer">Register</label> */}
              <button type="submit" className="bg-gray-500 px-2 py-2 mt-8 rounded-md w-full text-white hover:bg-gray-600">Login</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}