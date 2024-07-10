import { Link, Outlet } from "react-router-dom";

export function Dashboard() {
  return (
    <div id={'page-wrapper'} style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', height: '72px', padding: '16px', width: '100%', gap: '20px', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Link to={'/view1'}>
          <h2>{'Everything'}</h2>
        </Link>
        <Link to={'/view2'}>
          <h2>{'Primary View'}</h2>
        </Link>
      </div>
      <div style={{backgroundColor: '#1f1f1f', height: '90vh', width: '97%', margin: '16px' }}>
        <Outlet />
      </div>
    </div>
  );
}
