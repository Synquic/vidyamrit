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
  schools: "/schools",
  schoolAdmin: "/school-admins",
  //
  mentors: "/mentors",
  mentorManagement: "/mentor-management",
  volunteers: "/volunteers",
  students: "/students",
  cohorts: "/cohorts",
  //
  baselineAssessments: "/baseline-assessments",
  //
  studentReports: "/student-reports",
  assessmentQuestionSets: "/assessment-question-sets",
  //
  attendanceManagement: "/attendance",
  tutorAttendance: "/attendance/tutor",
  cohortAttendance: "/attendance/cohort/:cohortId",
  learningGroups: "/groups",
  progressMonitoring: "/progress",
  tutorProgress: "/progress/tutor", 
  cohortProgress: "/progress/cohort/:cohortId",
  managePrograms: "/programs",
} as const;

export type DashboardRouteKey = keyof typeof DASHBOARD_ROUTE_PATHS;
export type DashboardRoutePath =
  (typeof DASHBOARD_ROUTE_PATHS)[DashboardRouteKey];
