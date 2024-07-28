import { Link } from "react-router-dom";

export function Sidebar() {
  return (
    <aside style={{ height: '100vh', width: '300px', borderRadius: '8px', borderRight: '1px solid white', background: '#4a4a4a', boxShadow: '2px 0 10px rgba(255,255, 255, 0.2)' }}>
      <Link to={'/view1'}>
        <h3>{'Everything'}</h3>
      </Link>
      <Link to={'/view2'}>
        <h3>{'Primary View'}</h3>
      </Link>
      <Link to={'/view3'}>
        <h3>{'Entity'}</h3>
      </Link>
    </aside>
  )
}