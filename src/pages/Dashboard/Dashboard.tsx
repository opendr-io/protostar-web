import { Link, Outlet } from "react-router-dom";

export function Dashboard() {
  return (
    <div id={'page-wrapper'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', height: '72px', width: '100%', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
        <Link to={'/view1'}>
          <h3>{'Everything'}</h3>
        </Link>
        <Link to={'/view2'}>
          <h3>{'Primary View'}</h3>
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
