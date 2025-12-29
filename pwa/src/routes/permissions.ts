import { UserRole } from "@/types/user";
import { DASHBOARD_ROUTE_PATHS } from "./index";

export const routePermissions: Record<string, UserRole[]> = {
  [DASHBOARD_ROUTE_PATHS.schools]: [UserRole.SUPER_ADMIN],
  // [DASHBOARD_ROUTE_PATHS.schoolAdmin]: [UserRole.SUPER_ADMIN],
  [DASHBOARD_ROUTE_PATHS.mentors]: [UserRole.SUPER_ADMIN],
  // [DASHBOARD_ROUTE_PATHS.mentorManagement]: [UserRole.SUPER_ADMIN],
  [DASHBOARD_ROUTE_PATHS.volunteers]: [UserRole.SUPER_ADMIN],
  [DASHBOARD_ROUTE_PATHS.students]: [
    UserRole.SUPER_ADMIN,
    UserRole.TUTOR,
    UserRole.VOLUNTEER,
  ],
  [DASHBOARD_ROUTE_PATHS.studentReport]: [
    UserRole.SUPER_ADMIN,
    UserRole.TUTOR,
    UserRole.VOLUNTEER,
  ],
  [DASHBOARD_ROUTE_PATHS.cohorts]: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
  [DASHBOARD_ROUTE_PATHS.baselineAssessments]: [
    UserRole.SUPER_ADMIN,
    UserRole.TUTOR,
    UserRole.VOLUNTEER,
  ],
  // [DASHBOARD_ROUTE_PATHS.studentReports]: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
  [DASHBOARD_ROUTE_PATHS.attendanceManagement]: [
    UserRole.SUPER_ADMIN,
    UserRole.TUTOR,
  ],
  // [DASHBOARD_ROUTE_PATHS.learningGroups]: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
  // [DASHBOARD_ROUTE_PATHS.progressMonitoring]: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
  [DASHBOARD_ROUTE_PATHS.tutorProgress]: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
  // [DASHBOARD_ROUTE_PATHS.cohortProgress]: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
  // [DASHBOARD_ROUTE_PATHS.assessmentQuestionSets]: [UserRole.SUPER_ADMIN],
  [DASHBOARD_ROUTE_PATHS.managePrograms]: [UserRole.SUPER_ADMIN],
  [DASHBOARD_ROUTE_PATHS.views]: [UserRole.SUPER_ADMIN],
  [DASHBOARD_ROUTE_PATHS.viewDashboard]: [UserRole.VIEW_USER],
  [DASHBOARD_ROUTE_PATHS.reports]: [UserRole.SUPER_ADMIN],
};
