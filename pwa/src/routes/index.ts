export const PUBLIC_ROUTE_PATHS = {
  support: "/support",
} as const;

export type PublicRouteKey = keyof typeof PUBLIC_ROUTE_PATHS;
export type PublicRoutePath = (typeof PUBLIC_ROUTE_PATHS)[PublicRouteKey];

export const AUTH_ROUTE_PATHS = {
  login: "/login",
  register: "/register",
  logout: "/logout",
} as const;

export type AuthRouteKey = keyof typeof AUTH_ROUTE_PATHS;
export type AuthRoutePath = (typeof AUTH_ROUTE_PATHS)[AuthRouteKey];

export const DASHBOARD_ROUTE_PATHS = {
  dashboard: "/dashboard",
  //
  students: "/students",
  mentors: "/mentors",
  volunteers: "/volunteers",
  managePrograms: "/programs",
  cohorts: "/cohorts",
  baselineAssessments: "/baseline-assessments",
  attendanceManagement: "/attendance",
  tutorProgress: "/progress/tutor",
  schools: "/schools",
  views: "/views",
  viewDashboard: "/view-dashboard",
  reports: "/reports",
  //
  // schoolAdmin: "/school-admins",
  //
  // mentorManagement: "/mentor-management",
  // //
  // //
  // studentReports: "/student-reports",
  // assessmentQuestionSets: "/assessment-question-sets",
  // //
  // tutorAttendance: "/attendance/tutor",
  // cohortAttendance: "/attendance/cohort/:cohortId",
  // learningGroups: "/groups",
  // progressMonitoring: "/progress",
  // cohortProgress: "/progress/cohort/:cohortId",
} as const;

export type DashboardRouteKey = keyof typeof DASHBOARD_ROUTE_PATHS;
export type DashboardRoutePath =
  (typeof DASHBOARD_ROUTE_PATHS)[DashboardRouteKey];
