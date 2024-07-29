import React from "react";
import { Link } from "react-router-dom";


const SidebarRow: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return <div style={{
    padding: '8px 16px',
    border: '1px solid #ff6e5f',
    backgroundColor: '#ff584d',
  }}>
    {children}
  </div>
}

export function Sidebar() {
  return (
    <aside style={{ height: '100vh', width: '300px', borderRadius: '8px', borderRight: '1px solid white', background: '#4a4a4a', boxShadow: '2px 0 10px rgba(255,255, 255, 0.2)' }}>
      <h2 style={{ marginTop: 48, marginLeft: 12 }}>{'Dashboards'}</h2>
      <Link to={'/view1'}>
        <SidebarRow>{'Everything'}</SidebarRow>
      </Link>
      <Link to={'/view2'}>
        <SidebarRow>{'Primary View'}</SidebarRow>
      </Link>
      <Link to={'/view3'}>
        <SidebarRow>{'Entity'}</SidebarRow>
      </Link>
    </aside>
  )
}