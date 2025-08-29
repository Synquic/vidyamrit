"use client";

import {
  LayoutDashboard,
  Users,
  FilePlus2,
  BarChart2,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarItem_Mentor() {
  const sidebarItems: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[] = [
    {
      name: "Dashboard Home",
      url: "/mentor/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Students",
      url: "/mentor/students",
      icon: Users,
    },
    {
      name: "Conduct Test",
      url: "/mentor/conduct-test",
      icon: FilePlus2,
    },
    {
      name: "My Reports",
      url: "/mentor/reports",
      icon: BarChart2,
    },
    {
      name: "My Schedule",
      url: "/mentor/schedule",
      icon: CalendarDays,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Mentor View</SidebarGroupLabel>
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
      </SidebarMenu>
    </SidebarGroup>
  );
}
