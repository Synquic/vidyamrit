"use client";

import { useState, useMemo } from "react";
import { Bell, X, BookOpen, Users, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getTutorProgressSummary, TutorProgressSummary } from "@/services/progress";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { useAuth } from "@/hooks/useAuth";

const tips = [
  {
    id: "tip-1",
    title: "Welcome to Vidyamrit",
    message: "Start by conducting baseline tests for your students.",
    label: "Getting Started",
    icon: BookOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "tip-2",
    title: "Groups Ready",
    message: "Use Auto Generate to create student groups based on test results.",
    label: "Tip",
    icon: Users,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
];

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();
  const schoolId = selectedSchool?._id;

  // Fetch cohort progress data for test readiness
  const { data: progressData = [] } = useQuery<TutorProgressSummary[]>({
    queryKey: ["tutor-progress-notifications", schoolId],
    queryFn: () => getTutorProgressSummary(schoolId),
    enabled: !!user && isOpen,
    staleTime: 1000 * 60 * 5,
  });

  // Generate dynamic notifications from cohort data
  const dynamicNotifications = useMemo(() => {
    const notifications: {
      id: string;
      title: string;
      message: string;
      label: string;
      icon: typeof Bell;
      iconBg: string;
      iconColor: string;
      priority: number;
    }[] = [];

    progressData.forEach((item) => {
      const cohortName = item.cohort?.name || "Unknown Group";
      const level = item.cohort?.currentLevel || 1;

      // Ready for test
      if (item.levelProgress?.isReadyForAssessment) {
        notifications.push({
          id: `ready-${item.cohort._id}`,
          title: `${cohortName} - Ready for Test`,
          message: `Level ${level} teaching is complete. Conduct a level test now.`,
          label: "Test Due",
          icon: AlertTriangle,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          priority: 1,
        });
      }
      // Close to test (3 days or less)
      else if (item.levelProgress?.daysRemaining !== undefined && item.levelProgress.daysRemaining <= 3 && item.levelProgress.daysRemaining > 0) {
        notifications.push({
          id: `soon-${item.cohort._id}`,
          title: `${cohortName} - Test Soon`,
          message: `Level ${level} test in ${item.levelProgress.daysRemaining} day${item.levelProgress.daysRemaining > 1 ? 's' : ''}.`,
          label: "Upcoming",
          icon: Clock,
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          priority: 2,
        });
      }
    });

    // Sort by priority (ready first, then upcoming)
    notifications.sort((a, b) => a.priority - b.priority);
    return notifications;
  }, [progressData]);

  const allNotifications = [...dynamicNotifications, ...tips];
  const hasAlerts = dynamicNotifications.length > 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-12 w-12 sm:h-9 sm:w-9"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-7 w-7 sm:h-5 sm:w-5" />
        {hasAlerts && (
          <span className="absolute top-0.5 right-0.5 sm:top-0 sm:right-0 h-2.5 w-2.5 sm:h-2 sm:w-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-2 sm:right-4 top-14 w-[calc(100vw-1rem)] sm:w-80 z-[100] bg-white rounded-xl shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-gray-900">Notifications</h3>
                {dynamicNotifications.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {dynamicNotifications.length}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {dynamicNotifications.length > 0 && (
                <div className="px-3 py-1.5 bg-red-50 border-b border-red-100">
                  <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Alerts</p>
                </div>
              )}
              {allNotifications.map((notification, index) => (
                <div key={notification.id}>
                  {index === dynamicNotifications.length && dynamicNotifications.length > 0 && (
                    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tips</p>
                    </div>
                  )}
                  <div
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index !== allNotifications.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div className={`${notification.iconBg} p-2 rounded-lg flex-shrink-0 mt-0.5`}>
                      <notification.icon className={`h-4 w-4 ${notification.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">
                        {notification.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <p className="text-[11px] text-gray-400 text-center">
                {dynamicNotifications.length > 0
                  ? `${dynamicNotifications.length} alert${dynamicNotifications.length > 1 ? 's' : ''} require attention`
                  : "No pending alerts"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
