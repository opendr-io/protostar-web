import { Link, Outlet } from "react-router-dom";

export function Dashboard() {
  return (
    <>
      <div style={{ display: "flex", width: "100%", gap: "20px" }}>
        <Link to={"/view1"}>
          <h3>{"Everything"}</h3>
        </Link>
        <Link to={"/view2"}>
          <h3>{"Primary View"}</h3>
        </Link>
      </div>
      <Outlet />
    </>
  );
}
