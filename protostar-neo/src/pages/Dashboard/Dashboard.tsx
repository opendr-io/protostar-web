import { Outlet } from "react-router-dom";
// import { Sidebar } from '../../components/Sidebar/Sidebar'

export function Dashboard() {
  return (
    <div id={'page-wrapper'} style={{ display: 'flex', height: '100vh', flexDirection: 'row', alignItems: 'center' }}>
      <div style={{ width: '100%' }}>
        <Outlet />
      </div>
    </div>
  );
}