"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { School, UserRole } from "@/lib/types";
import { getSchools } from "@/services/schools";

const SchoolIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="3" width="10" height="10" rx="2" />
  </svg>
);

export function SchoolSwitcher() {
  const { isMobile } = useSidebar();
  const { user } = useAuth();
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  const [activeSchool, setActiveSchool] = React.useState<School | null>(null);

  // For non-super-admin users, find and set their assigned school
  React.useEffect(() => {
    if (
      user &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.schoolId &&
      typeof user.schoolId === "object"
    ) {
      const assignedSchool = schools.find((s) => s._id === user.schoolId._id);
      if (assignedSchool && assignedSchool._id) {
        setActiveSchool({
          ...assignedSchool,
          _id: assignedSchool._id || "",
        });
      }
    } else if (schools.length > 0 && !activeSchool) {
      const firstSchool = schools[0];
      setActiveSchool({
        ...firstSchool,
        _id: firstSchool._id || "",
      });
    }
  }, [user, schools, activeSchool]);

  if (isLoading || !activeSchool) {
    return null;
  }

  // For non-super-admin users or if there's only one school, just show it without dropdown
  if (user?.role !== UserRole.SUPER_ADMIN || schools.length === 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <SchoolIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeSchool.name}</span>
              <span className="truncate text-xs">{activeSchool.type}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Super admin with multiple schools: show dropdown
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <SchoolIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeSchool.name}
                </span>
                <span className="truncate text-xs">{activeSchool.type}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Schools
            </DropdownMenuLabel>
            {schools.map((school, index) => (
              <DropdownMenuItem
                key={school._id}
                onClick={() =>
                  setActiveSchool({ ...school, _id: school._id || "" })
                }
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <SchoolIcon className="size-3.5 shrink-0" />
                </div>
                {school.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {user?.role === UserRole.SUPER_ADMIN && (
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add school
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
