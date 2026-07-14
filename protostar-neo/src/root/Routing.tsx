import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { View1 } from "../pages/Dashboard/View1";
import { View2 } from "../pages/Dashboard/View2";
import { View3 } from "../pages/Dashboard/View3";
import { View4 } from "../pages/Dashboard/Experimental/View4";
import { View5 } from "../pages/Dashboard/Experimental/View5";
import { View6 } from "../pages/Dashboard/Experimental/View6";
import { View7 } from "../pages/Dashboard/Experimental/View7";
import { Login } from "../pages/Login/Login";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
    children: [
      {
        path: "/view1",
        Component: View1
      },
      {
        path: "/view2",
        Component: View2,
      },
      {
        path: "/view3",
        Component: View3,
      },
    ],
  },
  {
    path: "/experiment",
    Component: Dashboard,
    children: [
      {
        path: "view4",
        Component: View4
      },
      {
        path: "view5",
        Component: View5
      },
      {
        path: "view6",
        Component: View6
      },
      {
        path: "view7",
        Component: View7
      }
    ]
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export function Routing() {
  return <RouterProvider router={router} />;
}
