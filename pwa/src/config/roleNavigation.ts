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
  TrendingUp,
  // BarChart3, // Temporarily hidden - Reports & Analytics
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
    title: "Cohort Management",
    url: DASHBOARD_ROUTE_PATHS.cohorts,
    icon: Users,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
    description: "Organize students into learning groups",
  },
  {
    title: "Baseline Assessments",
    url: DASHBOARD_ROUTE_PATHS.baselineAssessments,
    icon: ClipboardList,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER],
    description: "Conduct student assessments",
  },
  {
    title: "Daily Attendance",
    url: DASHBOARD_ROUTE_PATHS.tutorAttendance,
    icon: Calendar,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
    description: "Track daily student attendance",
  },
  {
    title: "Progress Monitoring",
    url: DASHBOARD_ROUTE_PATHS.tutorProgress,
    icon: TrendingUp,
    allowedRoles: [UserRole.SUPER_ADMIN, UserRole.TUTOR],
    description: "Monitor student learning progress",
  },
  {
    title: "School Management",
    url: DASHBOARD_ROUTE_PATHS.schools,
    icon: School,
    allowedRoles: [UserRole.SUPER_ADMIN],
    description: "Manage schools and their configurations",
  },
];

// Helper function to get navigation items for a specific role
export const getNavigationForRole = (userRole: UserRole): NavigationItem[] => {
  return navigationItems.filter((item) => item.allowedRoles.includes(userRole));
};
