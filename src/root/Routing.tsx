import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { Login } from "../pages/Login/Login";
import { View1 } from "../pages/Dashboard/View1";
import { View2 } from "../pages/Dashboard/View2";
import { View3 } from "../pages/Dashboard/View3";

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
