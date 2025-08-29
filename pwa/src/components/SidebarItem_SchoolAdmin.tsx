"use client";

import {
  LayoutDashboard,
  School,
  Users,
  UserCog,
  BarChart2,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarItem_SchoolAdmin() {
  const sidebarItems: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[] = [
    {
      name: "Dashboard Home",
      url: "/schooladmin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My School",
      url: "/schooladmin/myschool",
      icon: School,
    },
    {
      name: "Manage Students",
      url: "/schooladmin/students",
      icon: Users,
    },
    {
      name: "Manage Mentors",
      url: "/schooladmin/mentors",
      icon: UserCog,
    },
    {
      name: "Manage Cohorts",
      url: "/schooladmin/cohorts",
      icon: Users,
    },
    {
      name: "Reports",
      url: "/schooladmin/reports",
      icon: BarChart2,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>NavSchool Admin</SidebarGroupLabel>
      <SidebarMenu>
        {sidebarItems.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
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
