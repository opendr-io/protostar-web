import React from "react";
import { useEffect, useState } from "react";
import { Home } from '../pages/Home';
import { Alerts } from "../pages/Alerts";
import { Summary } from '../pages/Summary';
import { EverythingDash } from "../dashboards/EverythingDash";
import { PrimaryDash } from "../dashboards/PrimaryDash";
import { EntityDash } from "../dashboards/EntityDash";
import { Settings } from "../pages/Settings";
import { Details } from "../pages/Details";
import { View4 } from "../dashboards/View4";
import { View5 } from "../dashboards/View5";
import { View6 } from "../dashboards/View6";
import { View7 } from "../dashboards/View7";
import { Login } from "../pages/Login";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import SessionManagementService from "../services/SessionManagementService";

function ProtectedRoute(token: any)
{
  let t = token['token'];
  if(t === null)
  {
    return <Navigate to={'/login'} replace />;
  }
  return <Outlet />;
};

export function Menu()
{
  let sms = new SessionManagementService();
  const subMenuItems = [
    { id: 1, label: 'Alpha Signals', link:'/primary', element: <PrimaryDash /> },
    { id: 4, label: 'Beta Signals', link: '/view4', element: <View4 /> },
    { id: 5, label: 'Gamma Signals', link: '/view5', element: <View5 /> },
    { id: 2, label: 'Detail View', link: '/entity', element: <EntityDash /> },
    { id: 3, label: 'Global View', link: '/everything', element: <EverythingDash/> },
    { id: 6, label: 'View 6', link: '/view6', element: <View6 /> },
    { id: 7, label: 'View 7', link: '/view7', element: <View7 /> },
  ];

  function MenuOptions()
  {
    const [isHovered, setIsHovered] = useState(false);
    if(localStorage.getItem('token') !== null)
    {
      return (
        <div className={`${localStorage.getItem('token') != null ? 'fixed top-0 left-0 z-9999 h-12 bg-black text-white border-none border-gray-200 w-screen' : 'hidden'}`}>
          <div className="grid h-full grid-cols-12 gap-2 px-2 transition-colors duration-200 w-[80rem]">
            <Link to="/" className="inline-flex flex-col items-center justify-center hover:bg-gray-600 px-2">
              <span>Home</span>
            </Link>
            <Link to="/summary" className="inline-flex flex-col items-center justify-center hover:bg-gray-600 px-2">
              <span>Tactical</span>
            </Link>
            <div className="inline-flex cursor-pointer flex-col items-center justify-center hover:bg-gray-600 px-2 relative" 
                 onMouseEnter={() => setIsHovered(true)} 
                 onMouseLeave={(e) => {
                   // Only close menu if mouse leaves the menu and dropdown
                   if (!e.currentTarget.contains(e.relatedTarget)) {
                     setIsHovered(false);
                   }
                 }}>
              <span>Visual</span>
              <div className={`
                absolute left-0 top-full w-40 rounded-md shadow-lg bg-black text-white
                ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}
              `} style={{
                marginTop: '10px',
                zIndex: 10000,
                pointerEvents: isHovered ? 'auto' : 'none'
              }}>
                <div className="overflow-y-auto max-h-[400px]">
                  {subMenuItems.map(item => (
                    <Link to={item.link} 
                          className="block w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsHovered(false);
                          }}>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/alerts" className="inline-flex flex-col items-center justify-center hover:bg-gray-600 px-2">
              <span>Alerts</span>
            </Link>
            <Link to="/settings" className="inline-flex flex-col items-center justify-center hover:bg-gray-600 px-2">
              <span>Settings</span>
            </Link>
            <Link to="/login" onClick={async () => 
              {
                sms.Logout();
                window.location.reload();
              }} className="inline-flex flex-col items-center justify-center hover:bg-gray-600 px-2">
               <span>Logout</span>
            </Link>
          </div>
        </div>
      );
    }
  }
  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute token={localStorage.getItem('token')} />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/details" element={<Details />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/settings" element={<Settings />} />
          {subMenuItems.map(item => (
            <Route path={item.link} element={item.element}></Route>
          ))}
        </Route>
        <Route path="/login" element={<Login />}/>
      </Routes>
      <MenuOptions />
    </Router>
  )
}