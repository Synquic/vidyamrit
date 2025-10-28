// import PWABadge from "./components/pwa/PWABadge.tsx";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//
import { AuthProvider } from "./providers/AuthProvider";
import { SchoolProvider } from "./contexts/SchoolContext";
import "./lib/i18n";
import { Toaster } from "@/components/ui/sonner";
//
import {
  PUBLIC_ROUTE_PATHS,
  AUTH_ROUTE_PATHS,
  DASHBOARD_ROUTE_PATHS,
} from "@/routes";
//
import ProtectedRoute from "./components/ProtectedRoute";
import NotFoundComponent from "./components/NotFound";
//
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import LogoutPage from "./pages/auth/LogoutPage";
//
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
//
import LandingPage from "./pages/public/LandingPage";
import ManageTutors from "./pages/dashboard/ManageTutors";
import ManageStudents from "./pages/dashboard/ManageStudents";
import ManageSchools from "./pages/dashboard/ManageSchools";
import ManageCohorts from "./pages/dashboard/ManageCohorts";
import BaselineAssessmentsPage from "./pages/dashboard/BaselineAssessmentsPage";
import SupportPage from "./pages/public/SupportPage.tsx";
import ManagePrograms from "./pages/dashboard/ManagePrograms.tsx";
import ManageVolunteers from "./pages/dashboard/ManageVolunteers.tsx";
import CohortAttendance from "./pages/attendance/CohortAttendance.tsx";
import TutorAttendance from "./pages/attendance/TutorAttendance.tsx";
import TutorProgress from "./pages/progress/TutorProgress.tsx";
import CohortProgress from "./pages/progress/CohortProgress.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: () => <LandingPage />,
  },
  {
    path: PUBLIC_ROUTE_PATHS.support,
    Component: () => <SupportPage />,
  },
  // 404 not found
  {
    path: "*",
    Component: () => <NotFoundComponent />,
  },
  // Auth routes
  {
    path: AUTH_ROUTE_PATHS.login,
    Component: () => <LoginPage />,
  },
  {
    path: AUTH_ROUTE_PATHS.register,
    Component: () => <RegisterPage />,
  },
  {
    path: AUTH_ROUTE_PATHS.logout,
    Component: () => <LogoutPage />,
  },
  // Protected route with outlet for dashboard sidebar and layout
  {
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
        path: DASHBOARD_ROUTE_PATHS.schools,
        element: <ManageSchools />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.mentors,
        element: <ManageTutors />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.students,
        element: <ManageStudents />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.cohorts,
        element: <ManageCohorts />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.baselineAssessments,
        element: <BaselineAssessmentsPage />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.attendanceManagement,
        element: <TutorAttendance />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.tutorAttendance,
        element: <TutorAttendance />,
      },
      {
        path: "/attendance/cohort/:cohortId",
        element: <CohortAttendance />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.progressMonitoring,
        element: <TutorProgress />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.tutorProgress,
        element: <TutorProgress />,
      },
      {
        path: "/progress/cohort/:cohortId",
        element: <CohortProgress />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.managePrograms,
        element: <ManagePrograms />,
      },
      {
        path: DASHBOARD_ROUTE_PATHS.volunteers,
        element: <ManageVolunteers />,
      },  
    ],
  },
]);

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors />
        {/* <PWABadge /> */}
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
