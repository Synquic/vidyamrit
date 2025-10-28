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
      <SidebarGroupLabel className="sr-only">Dashboard</SidebarGroupLabel>
      <SidebarMenu className="flex flex-col">
        {items.map((item) => {
          const isActive = location.pathname === item.url;

          if (isActive) {
            // Active — prominent pill style (matches provided screenshot)
            return (
              <SidebarMenuItem key={item.title} className="mb-3">
                <SidebarMenuButton asChild>
                  <Link
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-full shadow-md",
                      "bg-black text-white",
                    )}
                    aria-current="page"
                    title={item.description || item.title}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Inactive — compact muted items
          return (
            <SidebarMenuItem key={item.title} className="mb-2">
              <SidebarMenuButton asChild>
                <Link
                  to={item.url}
                  className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground"
                  title={item.description || item.title}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span className="text-sm">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
