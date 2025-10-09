import { UserRole } from "@/types/user";
import { DASHBOARD_ROUTE_PATHS } from "./index";

export const routePermissions = {
  [DASHBOARD_ROUTE_PATHS.schools]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.schoolAdmin]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.mentors]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.mentorManagement]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.students]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.cohorts]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.baselineAssessments]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.studentReports]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.attendanceManagement]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.learningGroups]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.progressMonitoring]: UserRole.SUPER_ADMIN,
  [DASHBOARD_ROUTE_PATHS.assessmentQuestionSets]: UserRole.SUPER_ADMIN,
} as const;
