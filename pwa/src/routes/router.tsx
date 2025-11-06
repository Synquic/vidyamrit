import { createBrowserRouter } from "react-router";
import { Outlet } from "react-router";
import {
  AUTH_ROUTE_PATHS,
  DASHBOARD_ROUTE_PATHS,
  PUBLIC_ROUTE_PATHS,
} from "./index";
import { routePermissions } from "./permissions";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { SchoolProvider } from "@/contexts/SchoolContext";
import NotFoundComponent from "@/components/NotFound";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import LogoutPage from "@/pages/auth/LogoutPage";

// Public Pages
import LandingPage from "@/pages/public/LandingPage";
import SupportPage from "@/pages/public/SupportPage";

// Dashboard Pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ManageSchools from "@/pages/dashboard/ManageSchools";
import ManageStudents from "@/pages/dashboard/ManageStudents";
import ManageCohorts from "@/pages/dashboard/ManageCohorts";
import ManageVolunteers from "@/pages/dashboard/ManageVolunteers";
import BaselineAssessmentsPage from "@/pages/dashboard/BaselineAssessmentsPage";
import ManageTutors from "@/pages/dashboard/ManageTutors";
import ManagePrograms from "@/pages/dashboard/ManagePrograms";

// Attendance Pages
import AttendanceManagement from "@/pages/dashboard/AttendanceManagement";

// Progress Pages
import ProgressManagement from "@/pages/dashboard/ProgressManagement";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: PUBLIC_ROUTE_PATHS.support,
    element: <SupportPage />,
  },
  // 404 not found
  {
    path: "*",
    element: <NotFoundComponent />,
  },
  // Auth routes
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
  // Protected routes
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <SchoolProvider>
          <DashboardLayout>
            <Outlet />
          </DashboardLayout>
        </SchoolProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        path: DASHBOARD_ROUTE_PATHS.dashboard,
        element: <DashboardPage />,
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
        path: DASHBOARD_ROUTE_PATHS.mentors,
        element: (
          <ProtectedRoute
            requiredRole={routePermissions[DASHBOARD_ROUTE_PATHS.mentors]}
          >
            <ManageTutors />
          </ProtectedRoute>
        ),
      },
      {
        path: DASHBOARD_ROUTE_PATHS.volunteers,
        element: (
          <ProtectedRoute
            requiredRole={routePermissions[DASHBOARD_ROUTE_PATHS.volunteers]}
          >
            <ManageVolunteers />
          </ProtectedRoute>
        ),
      },
      {
        path: DASHBOARD_ROUTE_PATHS.managePrograms,
        element: (
          <ProtectedRoute
            requiredRole={
              routePermissions[DASHBOARD_ROUTE_PATHS.managePrograms]
            }
          >
            <ManagePrograms />
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
      {
        path: DASHBOARD_ROUTE_PATHS.attendanceManagement,
        element: (
          <ProtectedRoute
            requiredRole={
              routePermissions[DASHBOARD_ROUTE_PATHS.attendanceManagement]
            }
          >
            <AttendanceManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: `${DASHBOARD_ROUTE_PATHS.attendanceManagement}/cohort/:cohortId`,
        element: (
          <ProtectedRoute
            requiredRole={
              routePermissions[DASHBOARD_ROUTE_PATHS.attendanceManagement]
            }
          >
            <AttendanceManagement />
          </ProtectedRoute>
        ),
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
        path: DASHBOARD_ROUTE_PATHS.tutorProgress,
        element: (
          <ProtectedRoute
            requiredRole={routePermissions[DASHBOARD_ROUTE_PATHS.tutorProgress]}
          >
            <ProgressManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "/progress/cohort/:cohortId",
        element: (
          <ProtectedRoute
            requiredRole={routePermissions[DASHBOARD_ROUTE_PATHS.tutorProgress]}
          >
            <ProgressManagement />
          </ProtectedRoute>
        ),
      },
      // {
      //   path: "/attendance/cohort/:cohortId",
      //   element: <CohortAttendance />,
      // },
      // {
      //   path: "/progress/cohort/:cohortId",
      //   element: <CohortProgress />,
      // },
    ],
  },
]);
