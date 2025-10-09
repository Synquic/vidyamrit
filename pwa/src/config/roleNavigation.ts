import { UserRole } from "@/types/user";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";
import { School, UserPen, UserStar } from "lucide-react";
import { RoleNavigation } from "@/types/navigation";

export const universalNavigationItem = {
  title: "Questions",
  url: DASHBOARD_ROUTE_PATHS.assessmentQuestionSets,
  icon: UserStar,
};

export const roleNavigation: RoleNavigation = {
  [UserRole.SUPER_ADMIN]: {
    title: "Super Admin",
    url: "#",
    icon: UserStar,
    items: [
      {
        title: "Manage Schools",
        url: DASHBOARD_ROUTE_PATHS.schools,
      },
      {
        title: "Manage School Admins",
        url: DASHBOARD_ROUTE_PATHS.schoolAdmin,
      },
      {
        title: "Manage Programs",
        url: DASHBOARD_ROUTE_PATHS.managePrograms,
      },
    ],
  },
  [UserRole.SCHOOL_ADMIN]: {
    title: "School Admin",
    url: "#",
    icon: School,
    items: [
      {
        title: "Manage Mentors",
        url: DASHBOARD_ROUTE_PATHS.mentors,
      },
      {
        title: "Tutor Management",
        url: DASHBOARD_ROUTE_PATHS.mentorManagement,
      },
      {
        title: "Manage Students",
        url: DASHBOARD_ROUTE_PATHS.students,
      },
      {
        title: "Manage Cohorts",
        url: DASHBOARD_ROUTE_PATHS.cohorts,
      },
      {
        title: "Daily Attendance",
        url: DASHBOARD_ROUTE_PATHS.attendanceManagement,
      },
      {
        title: "Learning Groups",
        url: DASHBOARD_ROUTE_PATHS.learningGroups,
      },
    ],
  },
  [UserRole.MENTOR]: {
    title: "Mentor",
    url: "#",
    icon: UserPen,
    items: [
      {
        title: "Baseline Assessments",
        url: DASHBOARD_ROUTE_PATHS.baselineAssessments,
      },
      {
        title: "Student Reports",
        url: DASHBOARD_ROUTE_PATHS.studentReports,
      },
      {
        title: "Daily Attendance",
        url: DASHBOARD_ROUTE_PATHS.attendanceManagement,
      },
      {
        title: "Learning Groups",
        url: DASHBOARD_ROUTE_PATHS.learningGroups,
      },
      {
        title: "Progress Monitoring",
        url: DASHBOARD_ROUTE_PATHS.progressMonitoring,
      },
    ],
  },
};
