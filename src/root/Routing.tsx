import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { View1 } from "../pages/Dashboard/View1";
import { View2 } from "../pages/Dashboard/View2";
import { View3 } from "../pages/Dashboard/View3";
import { Login } from "../pages/Login/Login";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
    children: [
      {
        path: "/view1",
        element: <View1 />,
      },
      {
        path: "/view2",
        element: <View2 />,
      },
      {
        path: "/view3",
        element: <View3 />,
      },
      {
        path: "/view4",
        element: <div>{'Detailed view'}</div>
      }
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export function Routing() {
  return <RouterProvider router={router} />;
}
