"use client";

import {
  LayoutDashboard,
  School,
  UserCog,
  Users,
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

export function SidebarItem_SuperAdmin() {
  const sidebarItems: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[] = [
    {
      name: "Dashboard Home",
      url: "/superadmin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Manage Schools",
      url: "/superadmin/schools",
      icon: School,
    },
    {
      name: "Manage School Admins",
      url: "/superadmin/school-admins",
      icon: UserCog,
    },
    {
      name: "View All Students",
      url: "/superadmin/students",
      icon: Users,
    },
    {
      name: "Global Reports",
      url: "/superadmin/reports",
      icon: BarChart2,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
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
