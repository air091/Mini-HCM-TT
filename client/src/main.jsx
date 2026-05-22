import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Dashboard from "./pages/employee_pages/Dashboard";
import History from "./pages/employee_pages/History";
import AdminDashboard from "./pages/admin_pages/AdminDashboard";
import Employees from "./pages/admin_pages/Employees";
import EmployeeDetail from "./pages/admin_pages/EmployeeDetail";
import Reports from "./pages/admin_pages/Reports";
import EmployeeLayout from "./layouts/employeeLayout";
import AdminLayout from "./layouts/adminLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  //logged in
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={["employee"]} />,
        children: [
          {
            element: <EmployeeLayout />,
            children: [
              {
                path: "/dashboard",
                element: <Dashboard />,
              },
              {
                path: "/history",
                element: <History />,
              },
            ],
          },
        ],
      },
      // admin only
      {
        element: <RoleRoute allowedRoles={["admin"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                path: "/admin/dashboard",
                element: <AdminDashboard />,
              },
              {
                path: "/admin/employees",
                element: <Employees />,
              },
              {
                path: "/admin/employees/:userId",
                element: <EmployeeDetail />,
              },
              {
                path: "/admin/reports",
                element: <Reports />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
