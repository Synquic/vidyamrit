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
import { MobileTabBar } from "./MobileTabBar";
import { Capacitor } from "@capacitor/core";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const isNative = Capacitor.isNativePlatform();
  // Hide sidebar for view users or on native (Capacitor) — uses tab bar instead
  const isViewUser = user && (user.role as string) === "view_user";
  const showSidebar = !isViewUser && !isNative;
  const showTabBar = isNative && !isViewUser;

  const getBreadcrumbTitle = () => {
    const path = location.pathname.slice(1);
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <SidebarProvider>
      {showSidebar && <AppSidebar />}
      <SidebarInset className={!showSidebar ? "w-full" : ""}>
        <header className="flex h-16 shrink-0 items-center gap-2 sm:gap-3 border-b bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-sm px-3 sm:px-4 shadow-sm overflow-visible">
          {showSidebar && (
            <>
              <SidebarTrigger className="-ml-1 hover:bg-accent/50 rounded-lg transition-colors h-7 w-7 [&_svg]:size-4 hidden sm:flex" />
              <SidebarTrigger className="-ml-1 hover:bg-accent/50 rounded-lg transition-colors h-12 px-3 [&_svg]:size-6 flex sm:hidden">
                <span className="text-base font-medium">Menu</span>
              </SidebarTrigger>
            </>
          )}
          {showSidebar && (
            <Separator orientation="vertical" className="mr-1 sm:mr-2 h-6" />
          )}
          <Breadcrumb className="min-w-0 flex-1 hidden md:block">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
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
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">
                      {t(getBreadcrumbTitle())}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {!isViewUser && <Notifications />}
            <LanguageToggleButton className="h-12 sm:h-8 px-4 sm:px-2.5 text-base sm:text-xs [&_svg]:size-6 sm:[&_svg]:size-4" />
          </div>
        </header>
        {/* Extra bottom padding on native so content doesn't hide behind the tab bar */}
        <div className={`flex flex-1 flex-col gap-6 p-4 sm:p-6 min-h-0 ${showTabBar ? "pb-20" : ""}`}>
          {children}
        </div>
        {!isNative && (
          <footer className="border-t bg-gradient-to-r from-background to-muted/30 px-4 py-3 text-xs text-muted-foreground text-center backdrop-blur-sm">
            © {new Date().getFullYear()} Vidyamrit. Made by{" "}
            <a
              href="https://synquic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              Synquic
            </a>
            .
          </footer>
        )}
      </SidebarInset>
      {showTabBar && <MobileTabBar />}
    </SidebarProvider>
  );
}
