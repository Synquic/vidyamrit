import { UserRole } from "@/types/user";
import { DASHBOARD_ROUTE_PATHS } from "./index";

export const routePermissions = {
    [DASHBOARD_ROUTE_PATHS.schools]: UserRole.SUPER_ADMIN,
    [DASHBOARD_ROUTE_PATHS.schoolAdmin]: UserRole.SUPER_ADMIN,
    [DASHBOARD_ROUTE_PATHS.mentors]: UserRole.SCHOOL_ADMIN,
    [DASHBOARD_ROUTE_PATHS.students]: UserRole.SCHOOL_ADMIN,
    [DASHBOARD_ROUTE_PATHS.cohorts]: UserRole.SCHOOL_ADMIN,
    [DASHBOARD_ROUTE_PATHS.baselineAssessments]: UserRole.MENTOR,
    [DASHBOARD_ROUTE_PATHS.studentReports]: UserRole.MENTOR,
} as const;
