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

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const getBreadcrumbTitle = () => {
    const path = location.pathname.slice(1);
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-15 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">{t("Admin Dashboard")}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {location.pathname !== "/dashboard" && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{t(getBreadcrumbTitle())}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          <LanguageToggleButton />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        <footer className="border-t px-4 py-0 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Parashwanath Enterprises. Made by{" "}
          <a
            href="https://synquic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:underline"
          >
            Synquic
          </a>
          .
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
