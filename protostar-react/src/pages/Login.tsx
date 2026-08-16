import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import SessionManagementService from '../services/SessionManagementService';

export function Login()
{
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  let sms = new SessionManagementService();

  const navigate = useNavigate();

  const handleLoginForm = async (event: any) =>
  {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try
    {
      await sms.Login(username, password);
      let t = localStorage.getItem('token');
      if(t)
      {
        navigate('/summary');
        window.location.reload();
      }
      else
      {
        setError('Login failed — no session was returned. Please try again.');
      }
    }
    catch (err: any)
    {
      const status = err?.response?.status;
      if(status === 401)
      {
        setError(err?.response?.data?.msg || 'Incorrect username or password.');
      }
      else if(status)
      {
        setError(`Login failed (server error ${status}). The service may be unavailable — please try again shortly.`);
      }
      else
      {
        setError('Cannot reach the server. Check that the backend is running, then try again.');
      }
    }
    finally
    {
      setSubmitting(false);
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
              {error && (
                <div role="alert" className="mt-4 w-full rounded-md border border-red-400 bg-red-50 p-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              <button type="submit" disabled={submitting} className="bg-gray-500 px-2 py-2 mt-8 rounded-md w-full text-white hover:bg-gray-600 disabled:opacity-60">{submitting ? 'Signing in…' : 'Login'}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
