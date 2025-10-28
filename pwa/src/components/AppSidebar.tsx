// Role-based unified sidebar - shows all relevant features based on user permissions

"use client";

import { useAuth } from "@/hooks/useAuth";
import { getNavigationForRole } from "@/config/roleNavigation";
import { LogOut, User, EllipsisVertical, Info } from "lucide-react";
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
import { LanguageToggleButton } from "./LanguageToggleButton";
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="w-full px-4 py-6 flex flex-col items-center">
          <div className="w-full max-w-[220px]">
            <SchoolSwitcher />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarItems items={navigationItems} />
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <User />
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <User />
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User />
                {t("Account")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Info />
                {t("Notifications")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LanguageToggleButton />
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 flex items-center gap-2 text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t("Logout")}
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
