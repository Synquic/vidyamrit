"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import { NavigationItem } from "@/config/roleNavigation";
import { cn } from "@/lib/utils";

interface SidebarItemsProps {
  items: NavigationItem[];
}

export function SidebarItems({ items }: SidebarItemsProps) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = location.pathname === item.url;

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.description || item.title}
                className={cn(
                  "transition-colors duration-200",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Link to={item.url} className="flex items-center gap-2">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
