import { UserRole } from "@/types/user";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";
import {
  School,
  Users,
  UserPen,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Calendar,
  Eye,
  BarChart3,
  LayoutDashboard,
  FileText,
  // Settings   // Temporarily hidden - School Admin Management
} from "lucide-react";

// Define navigation items with role-based access
export interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  allowedRoles: UserRole[];
  description?: string;
}

// Flat navigation structure with role-based access control
export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: DASHBOARD_ROUTE_PATHS.tutorDashboard,
    icon: LayoutDashboard,
    allowedRoles: [UserRole.TUTOR],
    description: "Overview of your groups, attendance and progress",
  },
  {
    title: "Student Management",
    url: DASHBOARD_ROUTE_PATHS.students,
    icon: GraduationCap,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER],
    description: "Manage student records and information",
  },
  {
    title: "Tutor Management",
    url: DASHBOARD_ROUTE_PATHS.mentors,
    icon: UserPen,
    allowedRoles: [UserRole.SUPER_ADMIN],
    description: "Manage tutors and assign them to schools",
  },
  {
    title: "Volunteer Management",
    url: DASHBOARD_ROUTE_PATHS.volunteers,
    icon: Users,
    allowedRoles: [UserRole.SUPER_ADMIN],
    description: "Create and manage volunteer accounts for schools",
  },
  {
    title: "Programme Management",
    url: DASHBOARD_ROUTE_PATHS.managePrograms,
    icon: BookOpen,
    allowedRoles: [UserRole.SUPER_ADMIN],
    description: "Create and manage learning programs",
  },
  {
    title: "Group Management",
    url: DASHBOARD_ROUTE_PATHS.cohorts,
    icon: Users,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
    description: "Organize students into learning groups",
  },
  {
    title: "Baseline Tests",
    url: DASHBOARD_ROUTE_PATHS.baselineAssessments,
    icon: ClipboardList,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER],
    description: "Conduct student tests",
  },
  {
    title: "Daily Attendance",
    url: DASHBOARD_ROUTE_PATHS.attendanceManagement,
    icon: Calendar,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
    description: "Track daily student attendance",
  },
  {
    title: "Test Reports",
    url: DASHBOARD_ROUTE_PATHS.testReports,
    icon: FileText,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
    description: "View student test scores and results",
  },
  {
    title: "School Management",
    url: DASHBOARD_ROUTE_PATHS.schools,
    icon: School,
    allowedRoles: [UserRole.SUPER_ADMIN],
    description: "Manage schools and their configurations",
  },
  {
    title: "View Management",
    url: DASHBOARD_ROUTE_PATHS.views,
    icon: Eye,
    allowedRoles: [UserRole.SUPER_ADMIN],
    description: "Create and manage custom views for stakeholders",
  },
  {
    title: "Reports",
    url: DASHBOARD_ROUTE_PATHS.reports,
    icon: BarChart3,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
    description: "View school, class and student reports",
  },
];

// Helper function to get navigation items for a specific role
export const getNavigationForRole = (userRole: UserRole): NavigationItem[] => {
  return navigationItems.filter((item) => item.allowedRoles.includes(userRole));
};
