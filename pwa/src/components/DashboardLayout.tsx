// Main admin layout wrapper providing sidebar, header, and content area for dashboard pages.
"use client";

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useTranslation } from "react-i18next";
import { LanguageToggleButton } from "@/components/LanguageToggleButton";
import Notifications from "./Notifications";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Hide sidebar for view users
  const isViewUser = user && (user.role as string) === "view_user";

  const getBreadcrumbTitle = () => {
    const path = location.pathname.slice(1);
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <SidebarProvider>
      {!isViewUser && <AppSidebar />}
      <SidebarInset className={isViewUser ? "w-full" : ""}>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-sm px-4 shadow-sm">
          {!isViewUser && (
            <SidebarTrigger className="-ml-1 hover:bg-accent/50 rounded-lg transition-colors" />
          )}
          {!isViewUser && (
            <Separator orientation="vertical" className="mr-2 h-6" />
          )}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link
                    to="/dashboard"
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    {t("Admin Dashboard")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {location.pathname !== "/dashboard" && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">
                      {t(getBreadcrumbTitle())}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          <Notifications />
          <LanguageToggleButton />
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-h-0">
          {children}
        </div>
        <footer className="border-t bg-gradient-to-r from-background to-muted/30 px-4 py-3 text-xs text-muted-foreground text-center backdrop-blur-sm">
          © {new Date().getFullYear()} Parashwanath Enterprises. Made by{" "}
          <a
            href="https://synquic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Synquic
          </a>
          .
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
