"use client";

import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardList,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getNavigationForRole } from "@/config/SidebarListAndRoleNavigation";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";
import { useMemo } from "react";
import { UserRole } from "@/types/user";

interface MobileTab {
  title: string;
  url: string;
  icon: React.ElementType;
  navTitle: string; // matches NavigationItem title for role filtering
}

const ALL_MOBILE_TABS: MobileTab[] = [
  {
    title: "Home",
    url: DASHBOARD_ROUTE_PATHS.dashboard,
    icon: LayoutDashboard,
    navTitle: "__home__", // always visible
  },
  {
    title: "Student",
    url: DASHBOARD_ROUTE_PATHS.students,
    icon: GraduationCap,
    navTitle: "Student Management",
  },
  {
    title: "Group",
    url: DASHBOARD_ROUTE_PATHS.cohorts,
    icon: Users,
    navTitle: "Group Management",
  },
  {
    title: "Test",
    url: DASHBOARD_ROUTE_PATHS.baselineAssessments,
    icon: ClipboardList,
    navTitle: "Baseline Tests",
  },
  {
    title: "Attendance",
    url: DASHBOARD_ROUTE_PATHS.attendanceManagement,
    icon: Calendar,
    navTitle: "Daily Attendance",
  },
  {
    title: "Reports",
    url: DASHBOARD_ROUTE_PATHS.reports,
    icon: BarChart3,
    navTitle: "Reports",
  },
];

export function MobileTabBar() {
  const { user } = useAuth();
  const location = useLocation();

  const visibleTabs = useMemo(() => {
    if (!user?.role) return [];
    const allowedTitles = new Set(
      getNavigationForRole(user.role as UserRole).map((item) => item.title)
    );
    return ALL_MOBILE_TABS.filter(
      (tab) => tab.navTitle === "__home__" || allowedTitles.has(tab.navTitle)
    );
  }, [user?.role]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around">
        {visibleTabs.map((tab) => {
          const isActive =
            tab.url === DASHBOARD_ROUTE_PATHS.dashboard
              ? location.pathname === tab.url
              : location.pathname.startsWith(tab.url);
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.url}
              to={tab.url}
              className="flex flex-col items-center justify-end pt-1 pb-2 flex-1 min-w-0 relative"
            >
              {/* Active top indicator bar */}
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200",
                  isActive ? "w-8 bg-blue-500" : "w-0 bg-transparent"
                )}
              />

              <Icon
                className={cn(
                  "w-6 h-6 mb-1 transition-colors duration-200",
                  isActive ? "text-blue-500" : "text-gray-700"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-colors duration-200",
                  isActive ? "text-blue-500" : "text-gray-700"
                )}
              >
                {tab.title}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
