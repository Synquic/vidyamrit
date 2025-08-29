"use client";

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  Newspaper,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";
import { useNavigate } from "react-router";

export function OpenAssessments({
  openAssessments,
}: {
  openAssessments: {
    name: string;
    assessment_id: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const navigator = useNavigate();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Open Assessments</SidebarGroupLabel>
      <SidebarMenu>
        {openAssessments.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              onClick={() => {
                navigator(
                  `${DASHBOARD_ROUTE_PATHS.baselineAssessments}?id=${item.assessment_id}`
                );
              }}
              asChild
            >
              <div>
                <Newspaper />
                <span>{item.name}</span>
              </div>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem
                  onClick={() => {
                    alert("opening assessment: " + item.assessment_id);
                  }}
                >
                  <Folder className="text-muted-foreground" />
                  <span>Open Assessment</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share / Reassign</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Assessment</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
