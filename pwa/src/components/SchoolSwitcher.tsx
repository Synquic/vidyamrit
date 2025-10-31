"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, School as LucideSchool } from "lucide-react";
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
import { UserRole } from "@/types/user";
import { getSchools } from "@/services/schools";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";

// use lucide School icon (imported as LucideSchool)

export function SchoolSwitcher() {
  const { isMobile, state } = useSidebar();
  const { user } = useAuth();
  const { selectedSchool, setSelectedSchool } = useSchoolContext();
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  const handleCreateSchool = async () => {
    window.location.href = DASHBOARD_ROUTE_PATHS.schools;
  };

  // Initialize selected school for super admin if none selected
  React.useEffect(() => {
    if (
      user?.role === UserRole.SUPER_ADMIN &&
      schools.length > 0 &&
      !selectedSchool
    ) {
      const storedSchoolId = localStorage.getItem("selectedSchoolId");
      let schoolToSelect = schools[0];

      if (storedSchoolId) {
        const storedSchool = schools.find((s) => s._id === storedSchoolId);
        if (storedSchool) {
          schoolToSelect = storedSchool;
        }
      }

      setSelectedSchool({
        ...schoolToSelect,
        _id: schoolToSelect._id || "",
      });
    }
  }, [user, schools, selectedSchool, setSelectedSchool]);

  if (isLoading || !selectedSchool) {
    return null;
  }

  const isCollapsed = state === "collapsed";

  // Build the card content used in desktop layouts
  const SchoolCardContent = (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
        {(selectedSchool as any).imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(selectedSchool as any).imageUrl}
            alt={selectedSchool.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <LucideSchool className="h-6 w-6" />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium truncate">
          {selectedSchool.name}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {selectedSchool.type}
        </div>
      </div>
      <div className="ml-auto flex-shrink-0">
        <ChevronsUpDown className="h-4 w-4" />
      </div>
    </div>
  );

  // Compact content for collapsed sidebar
  const CompactSchoolContent = (
    <div className="flex items-center justify-center w-full">
      <div className="h-8 w-8 rounded-md overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
        {(selectedSchool as any).imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(selectedSchool as any).imageUrl}
            alt={selectedSchool.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <LucideSchool className="h-4 w-4" />
        )}
      </div>
    </div>
  );

  // If mobile, keep previous dropdown style (existing behavior)
  if (isMobile) {
    // reuse original mobile dropdown trigger/content
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square h-8 w-8 items-center justify-center rounded-lg">
                  <LucideSchool className="h-4 w-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {selectedSchool.name}
                  </span>
                  <span className="truncate text-xs">
                    {selectedSchool.type}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg z-50"
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
                  onClick={() => {
                    setSelectedSchool({ ...school, _id: school._id || "" });
                    localStorage.setItem("selectedSchoolId", school._id || "");
                  }}
                  className="gap-2 p-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border">
                    <LucideSchool className="h-4 w-4 shrink-0" />
                  </div>
                  {school.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add school
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Desktop layout: clickable card that opens dropdown for super admin
  if (user?.role === UserRole.SUPER_ADMIN) {
    return (
      <div className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`w-full ${
                isCollapsed ? "p-2" : "p-3"
              } rounded-lg border bg-white hover:shadow-sm`}
            >
              {isCollapsed ? CompactSchoolContent : SchoolCardContent}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-[220px] rounded-lg z-50"
            align={isCollapsed ? "end" : "start"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Schools
            </DropdownMenuLabel>
            {schools.map((school) => (
              <DropdownMenuItem
                key={school._id}
                onClick={() => {
                  setSelectedSchool({ ...school, _id: school._id || "" });
                  localStorage.setItem("selectedSchoolId", school._id || "");
                }}
                className="gap-2 p-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md overflow-hidden bg-white flex items-center justify-center border">
                    {(school as any).imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(school as any).imageUrl}
                        alt={school.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <LucideSchool className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 text-sm truncate">{school.name}</div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={handleCreateSchool}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Add school
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Non-super-admin desktop: static card
  return (
    <div className="w-full">
      <div
        className={`w-full ${
          isCollapsed ? "p-2" : "p-3"
        } rounded-lg border bg-white`}
      >
        {isCollapsed ? CompactSchoolContent : SchoolCardContent}
      </div>
    </div>
  );
}
