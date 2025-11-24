// Role-based unified sidebar - shows all relevant features based on user permissions

"use client";

import { useAuth } from "@/hooks/useAuth";
import { getNavigationForRole } from "@/config/SidebarListAndRoleNavigation";
import { LogOut, User, EllipsisVertical, Info, BookOpen, GraduationCap } from "lucide-react";
import { SidebarItems } from "@/components/SidebarItems";
import { SchoolSwitcher } from "@/components/SchoolSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { logout } from "@/services/auth";
import { AUTH_ROUTE_PATHS } from "@/routes";

import { useMemo } from "react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isMobile } = useSidebar();

  // Get navigation items based on user's role
  const navigationItems = useMemo(() => {
    if (!user?.role) return [];
    return getNavigationForRole(user.role);
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    window.location.href = AUTH_ROUTE_PATHS.logout;
  };

  return (
    <Sidebar collapsible="icon" {...props} className="border-r-0 shadow-sm">
      <SidebarHeader className="border-b-0 bg-white/80 backdrop-blur-xl">
        <div className="w-full px-4 py-6 flex flex-col items-center gap-4">
          {/* Vidyamrit Logo and Brand */}
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-2">
            <div className="relative group">
              {/* Logo container with subtle shadow */}
              <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all duration-300 group-hover:scale-105">
                <BookOpen className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Brand text - hidden when collapsed */}
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent tracking-tight">
                Vidyamrit
              </h1>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                Education Platform
              </p>
            </div>
          </div>

          {/* School Switcher */}
          <div className="w-full max-w-[220px] group-data-[collapsible=icon]:hidden">
            <SchoolSwitcher />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white/50 backdrop-blur-xl">
        <SidebarItems items={navigationItems} />
      </SidebarContent>

      <SidebarFooter className="border-t-0 bg-white/80 backdrop-blur-xl shadow-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-gray-100/80 hover:bg-gray-50 transition-all duration-200 group rounded-xl"
            >
              {/* Avatar with modern styling */}
              <div className="relative">
                <Avatar className="h-9 w-9 rounded-xl border-2 border-white shadow-md bg-gradient-to-br from-orange-500 to-amber-600">
                  <div className="flex items-center justify-center w-full h-full">
                    <User className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </Avatar>
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-gray-900">{user?.name}</span>
                <span className="truncate text-xs text-gray-500 font-medium">{user?.email}</span>
              </div>

              <EllipsisVertical className="ml-auto size-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl border-gray-100 shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-t-2xl">
                <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-md bg-gradient-to-br from-orange-500 to-amber-600">
                  <div className="flex items-center justify-center w-full h-full">
                    <User className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-gray-900">{user?.name}</span>
                  <span className="truncate text-xs text-gray-500 font-medium">{user?.email}</span>
                  <span className="truncate text-xs text-gray-400 mt-0.5 capitalize font-medium">{user?.role?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-gray-100" />

            <DropdownMenuGroup className="p-2">
              <DropdownMenuItem className="rounded-xl hover:bg-gray-50 focus:bg-gray-50 cursor-pointer py-2.5">
                <User className="text-gray-600" />
                {t("Account")}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl hover:bg-gray-50 focus:bg-gray-50 cursor-pointer py-2.5">
                <Info className="text-gray-600" />
                {t("Notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-gray-100" />

            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors py-2.5"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {t("Logout")}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

       
      </SidebarFooter>

      <SidebarRail className="bg-gray-100/50" />
    </Sidebar>
  );
}
