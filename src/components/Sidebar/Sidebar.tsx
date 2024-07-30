import React from "react";
import { Link } from "react-router-dom";
import './Sidebar.css';

const SidebarRow: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return <div className={'sidebar-row'}>
    {children}
  </div>
}

export function Sidebar() {
  return (
    <aside className={'sidebar'}>
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