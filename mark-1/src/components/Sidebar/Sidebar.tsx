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
        <SidebarRow>{'All Graphs'}</SidebarRow>
      </Link>
      <Link to={'/view3'}>
        <SidebarRow>{'Detail View'}</SidebarRow>
      </Link>

      <h2 style={{ marginTop: 48, marginLeft: 12 }}>{'Experimental'}</h2>
      <Link to={'/experiment/view4'}>
        <SidebarRow>{'Isotopes'}</SidebarRow>
      </Link>
      <Link to={'/experiment/view5'}>
        <SidebarRow>{'Small Graphs'}</SidebarRow>
      </Link>
      <Link to={'/experiment/view6'}>
        <SidebarRow>{'Large Graphs'}</SidebarRow>
      </Link>
      <Link to={'/experiment/view7'}>
        <SidebarRow>{'View7'}</SidebarRow>
      </Link>
    </aside>
  )
}