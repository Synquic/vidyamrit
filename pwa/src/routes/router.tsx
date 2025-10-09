import { createBrowserRouter } from "react-router";
import { Outlet } from "react-router";
import { AUTH_ROUTE_PATHS, DASHBOARD_ROUTE_PATHS } from "./index";
import { routePermissions } from "./permissions";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import LogoutPage from "@/pages/auth/LogoutPage";

// Dashboard Pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ManageSchools from "@/pages/dashboard/ManageSchools";
import ManageStudents from "@/pages/dashboard/ManageStudents";
import ManageCohorts from "@/pages/dashboard/ManageCohorts";
import BaselineAssessmentsPage from "@/pages/dashboard/BaselineAssessmentsPage";

export const router = createBrowserRouter([
  {
    path: AUTH_ROUTE_PATHS.login,
    element: <LoginPage />,
  },
  {
    path: AUTH_ROUTE_PATHS.register,
    element: <RegisterPage />,
  },
  {
    path: AUTH_ROUTE_PATHS.logout,
    element: <LogoutPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </ProtectedRoute>
    ),
    children: [
      {
        path: DASHBOARD_ROUTE_PATHS.dashboard,
        element: <DashboardPage />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.schools,
        element: (
          <ProtectedRoute
            requiredRole={routePermissions[DASHBOARD_ROUTE_PATHS.schools]}
          >
            <ManageSchools />
          </ProtectedRoute>
        ),
      },
      {
        path: DASHBOARD_ROUTE_PATHS.students,
        element: (
          <ProtectedRoute
            requiredRole={routePermissions[DASHBOARD_ROUTE_PATHS.students]}
          >
            <ManageStudents />
          </ProtectedRoute>
        ),
      },
      {
        path: DASHBOARD_ROUTE_PATHS.cohorts,
        element: (
          <ProtectedRoute
            requiredRole={routePermissions[DASHBOARD_ROUTE_PATHS.cohorts]}
          >
            <ManageCohorts />
          </ProtectedRoute>
        ),
      },
      {
        path: DASHBOARD_ROUTE_PATHS.baselineAssessments,
        element: (
          <ProtectedRoute
            requiredRole={
              routePermissions[DASHBOARD_ROUTE_PATHS.baselineAssessments]
            }
          >
            <BaselineAssessmentsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
