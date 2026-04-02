import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  ArrowLeft,
  Save,
  PartyPopper,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Play,
  Search,
  User,
} from "lucide-react";
import {
  getTutorProgressSummary,
  getCohortProgress,
} from "@/services/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  getTutorAttendanceSummary,
  getCohortAttendance,
  recordCohortAttendance,
  getAttendanceRecords,
  bulkMarkAttendance,
  AttendanceStatus,
  CohortAttendanceRecord,
} from "@/services/attendance";
import {
  getCohorts,
  startCohort,
} from "@/services/cohorts";
import { getStudents } from "@/services/students";
import { programsService } from "@/services/programs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Link } from "react-router";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { getApiErrorMessage } from "@/services";

// Overview Component (TutorAttendance functionality)
function AttendanceOverview() {
  const { t } = useTranslation();
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [startingCohort, setStartingCohort] = useState<any>(null);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const queryClient = useQueryClient();

  const schoolId =
    isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;

  // Fetch upcoming assessments
  const { data: progressSummary = [] } = useQuery({
    queryKey: ["tutor-progress-summary", schoolId],
    queryFn: () => getTutorProgressSummary(schoolId),
    enabled: !!schoolId,
  });

  // Get upcoming assessments (within next 7 days)
  const upcomingAssessments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return progressSummary
      .filter((summary: any) => {
        if (!summary.nextAssessmentDue) return false;
        const assessmentDate = new Date(summary.nextAssessmentDue);
        return assessmentDate >= today && assessmentDate <= nextWeek;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.nextAssessmentDue || 0);
        const dateB = new Date(b.nextAssessmentDue || 0);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5); // Show top 5 upcoming
  }, [progressSummary]);

  const { data: attendanceSummary = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ["tutor-attendance-summary", selectedDate, schoolId],
    queryFn: async () => {
      const data = await getTutorAttendanceSummary(selectedDate, schoolId);

      const validSummaries = data.filter((summary) => {
        const isValid =
          summary && summary.cohort && summary.cohort._id && summary.attendance;

        if (!isValid) {
          console.warn("Invalid summary filtered out:", summary);
        }

        return isValid;
      });

      return validSummaries;
    },
    staleTime: 0, // Always fetch fresh
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Fetch cohorts to check start status
  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts-for-attendance", schoolId],
    queryFn: () => getCohorts(schoolId),
    enabled: !!schoolId,
    staleTime: 0, // Always fetch fresh data
  });

  // Start cohort mutation
  const startCohortMutation = useMutation({
    mutationFn: ({ id, startDate }: { id: string; startDate?: string }) =>
      startCohort(id, startDate),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts-for-attendance", schoolId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tutor-attendance-summary", selectedDate, schoolId],
      });
      queryClient.invalidateQueries({
        queryKey: ["cohorts", schoolId],
      });
      setIsStartDialogOpen(false);
      setStartingCohort(null);
      setCustomStartDate("");
      toast.success("Group started successfully");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to start group"));
    },
  });

  // Helper function to check if cohort has started
  const isCohortStarted = (cohortId: string): boolean => {
    const cohort = cohorts.find((c) => c._id === cohortId);
    if (!cohort) return false;
    return !!(
      cohort.timeTracking?.cohortStartDate ||
      cohort.startDate ||
      (cohort.timeTracking?.cohortStartDate &&
        new Date(cohort.timeTracking.cohortStartDate).getTime() > 0)
    );
  };

  // Get cohort start date
  const getCohortStartDate = (cohortId: string): string | null => {
    const cohort = cohorts.find((c) => c._id === cohortId);
    if (!cohort) return null;
    if (cohort.timeTracking?.cohortStartDate) {
      return cohort.timeTracking.cohortStartDate;
    }
    if (cohort.startDate) {
      return cohort.startDate;
    }
    return null;
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Handle start cohort
  const handleStartCohort = (cohort: any) => {
    setStartingCohort(cohort);
    setCustomStartDate(new Date().toISOString().split("T")[0]);
    setIsStartDialogOpen(true);
  };

  // Handle confirm start cohort
  const handleConfirmStartCohort = () => {
    if (!startingCohort?._id) return;

    const startDateToUse =
      customStartDate || new Date().toISOString().split("T")[0];
    startCohortMutation.mutate({
      id: startingCohort._id,
      startDate: startDateToUse,
    });
  };

  if (loading || isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 flex-shrink-0" />
            Group Overview
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            View and manage attendance across all groups
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const selected = new Date(e.target.value);
              const dayOfWeek = selected.getDay();

              // Prevent Sunday selection (day 0)
              if (dayOfWeek === 0) {
                toast.error(
                  "Sunday is a holiday. Please select a teaching day (Monday-Saturday)."
                );
                // Auto-select next Monday
                const nextMonday = new Date(selected);
                const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
                nextMonday.setDate(selected.getDate() + daysUntilMonday);
                setSelectedDate(nextMonday.toISOString().split("T")[0]);
                return;
              }

              setSelectedDate(e.target.value);
            }}
            onFocus={(e) => {
              // Set min date to prevent selecting past Sundays
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              e.currentTarget.min = today.toISOString().split("T")[0];
            }}
            className="flex-1 sm:flex-none px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
          />
        </div>
      </div>

      {/* Upcoming Assessments */}
      {upcomingAssessments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Upcoming Tests (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingAssessments.map((summary: any, idx) => {
                const assessmentDate = new Date(summary.nextAssessmentDue || 0);
                const daysUntil = Math.ceil(
                  (assessmentDate.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {summary.cohort?.name || "Unknown Group"}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {summary.program?.name ||
                          summary.program?.subject ||
                          "Program"}{" "}
                        - Level {summary.currentLevel || "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          daysUntil <= 1
                            ? "destructive"
                            : daysUntil <= 3
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {daysUntil === 0
                          ? "Today"
                          : daysUntil === 1
                          ? "Tomorrow"
                          : `${daysUntil} days`}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {assessmentDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {attendanceSummary.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t("attendance.noCohorts")}</p>
            <p className="text-gray-400 text-sm mt-2">
              {t("attendance.noCohortsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {attendanceSummary
            .filter(
              (summary) => summary && summary.cohort && summary.attendance
            )
            .map((summary) => (
              <Card
                key={summary.cohort._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-600 font-medium">
                        {summary.cohort.school?.name || "School not assigned"}
                      </p>
                      <Badge variant="outline" className="flex-shrink-0">
                        {summary.attendance.totalStudents} students
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      <span className="break-words">{summary.cohort.name}</span>
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Start Status */}
                  {!isCohortStarted(summary.cohort._id) ? (
                    <div className="flex items-center gap-2 text-sm p-2 bg-orange-50 border border-orange-200 rounded-md">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Not Started
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Started:{" "}
                        {formatDate(getCohortStartDate(summary.cohort._id))}
                      </span>
                    </div>
                  )}

                  {/* Attendance Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Present: {summary.attendance.presentCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Absent: {summary.attendance.absentCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>Unmarked: {summary.attendance.unmarkedCount}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {!isCohortStarted(summary.cohort._id) ? (
                      <Button
                        onClick={() => handleStartCohort(summary.cohort)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Group
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="w-full"
                        variant={
                          summary.attendance.unmarkedCount > 0
                            ? "default"
                            : "outline"
                        }
                      >
                        <Link to={`/attendance/cohort/${summary.cohort._id}`}>
                          {summary.attendance.unmarkedCount > 0
                            ? t("attendance.markAttendance")
                            : t("attendance.viewAttendance")}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Quick Stats Summary */}
      {attendanceSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("attendance.todaySummary")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceSummary.length}
                </div>
                <div className="text-sm text-gray-600">
                  {t("attendance.totalCohorts")}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {attendanceSummary.reduce(
                    (sum, s) => sum + s.attendance.totalStudents,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {t("attendance.totalStudents")}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {attendanceSummary.reduce(
                    (sum, s) => sum + s.attendance.presentCount,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {t("attendance.totalPresent")}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {attendanceSummary.reduce(
                    (sum, s) => sum + s.attendance.unmarkedCount,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {t("attendance.totalUnmarked")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Assessments */}
      {upcomingAssessments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">
                Upcoming Tests
              </CardTitle>
            </div>
            <p className="text-sm text-blue-700">
              Groups with tests due in the next 7 days
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssessments.map((summary) => {
                const assessmentDate = summary.timeTracking?.nextAssessmentDue
                  ? new Date(summary.timeTracking.nextAssessmentDue)
                  : null;
                const daysUntil =
                  summary.timeTracking?.daysUntilNextAssessment || 0;

                return (
                  <div
                    key={summary.cohort._id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {summary.cohort.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {summary.cohort.program?.subject || "N/A"} • Level{" "}
                        {summary.cohort.currentLevel || "N/A"}
                      </div>
                      {assessmentDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Due:{" "}
                          {assessmentDate.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {daysUntil <= 3 && daysUntil >= 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {daysUntil === 0
                            ? "Today"
                            : `${daysUntil} day${daysUntil > 1 ? "s" : ""}`}
                        </Badge>
                      )}
                      {daysUntil > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          {daysUntil} days
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Group Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Group</DialogTitle>
            <DialogDescription>
              Set a start date for "{startingCohort?.name}". The group will
              begin tracking progress and attendance from this date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Select a date to start the group. Leave as today's date to
                start immediately.
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Once started, the group will begin
                tracking:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Progress tracking from the start date</li>
                  <li>Attendance recording</li>
                  <li>Test timelines</li>
                </ul>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStartDialogOpen(false);
                setStartingCohort(null);
                setCustomStartDate("");
              }}
              disabled={startCohortMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStartCohort}
              disabled={startCohortMutation.isPending || !customStartDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {startCohortMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Cohort Detail Component (CohortAttendance functionality)
function CohortAttendanceDetail() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [attendanceRecords, setAttendanceRecords] = useState<{
    [studentId: string]: AttendanceStatus;
  }>({});
  const [isHoliday, setIsHoliday] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cohort progress for indicator
  const { data: _progressData } = useQuery({
    queryKey: ["cohort-progress-indicator", cohortId],
    queryFn: async () => {
      try {
        const data = await getCohortProgress(cohortId!);
        return data;
      } catch (error) {
        console.error("Error fetching cohort progress:", error);
        return null;
      }
    },
    enabled: !!cohortId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: cohortData, isLoading: loading } = useQuery({
    queryKey: ["cohort-attendance", cohortId, selectedDate],
    queryFn: async () => {
      try {
        const data = await getCohortAttendance(cohortId!, {
          date: selectedDate,
        });

        // Initialize attendance records with existing data
        const existingAttendance = data.attendance[selectedDate] || [];
        const records: { [studentId: string]: AttendanceStatus } = {};

        existingAttendance.forEach((record) => {
          records[record.student._id] = record.status;
        });

        setAttendanceRecords(records);

        // Check if selected date is a holiday
        const holidays = data.cohort.holidays || [];
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        const isHolidayDate = holidays.some((h: string) => {
          const holidayDate = new Date(h);
          holidayDate.setHours(0, 0, 0, 0);
          return holidayDate.toDateString() === selected.toDateString();
        });
        setIsHoliday(isHolidayDate);

        return data;
      } catch (error) {
        console.error("Error fetching cohort attendance:", error);
        toast.error(getApiErrorMessage(error, "Failed to load group attendance"));
        return null;
      }
    },
    enabled: !!cohortId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Reset attendance records when selectedDate changes
  useEffect(() => {
    if (cohortData) {
      const existingAttendance = cohortData.attendance[selectedDate] || [];
      const records: { [studentId: string]: AttendanceStatus } = {};

      existingAttendance.forEach((record) => {
        records[record.student._id] = record.status;
      });

      setAttendanceRecords(records);

      // Check if selected date is a holiday
      const holidays = cohortData.cohort.holidays || [];
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      const isHolidayDate = holidays.some((h: string) => {
        const holidayDate = new Date(h);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.toDateString() === selected.toDateString();
      });
      setIsHoliday(isHolidayDate);
    }
  }, [selectedDate, cohortData]);

  // Check if past date is locked (attendance already marked)
  // Only lock PAST dates (not today) that have existing attendance
  const todayLocal = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })();
  const isStrictlyPastDate = selectedDate < todayLocal;
  const existingRecords = cohortData?.attendance[selectedDate] || [];
  const isPastDateLocked = isStrictlyPastDate && existingRecords.length > 0;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };


  const saveAttendance = async () => {
    if (!cohortData || !cohortId) return;

    // Prevent saving if it's a holiday
    if (isHoliday) {
      toast.error(
        "Cannot save attendance on a holiday. Please unmark the holiday first."
      );
      return;
    }

    try {
      setSaving(true);

      const attendanceData: CohortAttendanceRecord[] = Object.entries(
        attendanceRecords
      ).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      if (attendanceData.length === 0) {
        toast.error("Please mark attendance for at least one student");
        return;
      }

      await recordCohortAttendance({
        cohortId,
        attendanceRecords: attendanceData,
        date: selectedDate,
      });

      toast.success(
        `Attendance saved successfully for ${attendanceData.length} students`
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["cohort-attendance", cohortId, selectedDate],
      });
      queryClient.invalidateQueries({ queryKey: ["tutor-attendance-summary"] });
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(getApiErrorMessage(error, "Failed to save attendance"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!cohortData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Group not found</p>
        <Button onClick={() => navigate("/attendance")} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const presentCount = Object.values(attendanceRecords).filter(
    (status) => status === "present"
  ).length;
  const absentCount = Object.values(attendanceRecords).filter(
    (status) => status === "absent"
  ).length;
  const totalMarked = Object.keys(attendanceRecords).length;
  const totalStudents = cohortData.cohort.students.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/attendance")}
          className="p-2 self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">{cohortData.cohort.name}</span>
          </h1>
        </div>
      </div>

      {/* Date and Quick Actions */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="space-y-3 sm:space-y-3">
            {/* Row 1: Date Picker and Progress Indicator */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const selected = new Date(e.target.value);
                    const dayOfWeek = selected.getDay();

                    // Prevent Sunday selection (day 0)
                    if (dayOfWeek === 0) {
                      toast.error(
                        "Sunday is a holiday. Please select a teaching day (Monday-Saturday)."
                      );
                      // Auto-select next Monday
                      const nextMonday = new Date(selected);
                      const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
                      nextMonday.setDate(selected.getDate() + daysUntilMonday);
                      setSelectedDate(nextMonday.toISOString().split("T")[0]);
                      return;
                    }

                    setSelectedDate(e.target.value);
                  }}
                  onFocus={(e) => {
                    // Allow past 1 week for marking missed attendance
                    const now = new Date();
                    const toLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    const minDate = new Date(now);
                    minDate.setDate(minDate.getDate() - 7);
                    e.currentTarget.min = toLocal(minDate);
                    e.currentTarget.max = toLocal(now);
                  }}
                  className="px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm w-full sm:w-auto"
                />
              </div>

            </div>

          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isHoliday && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700">
                <PartyPopper className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm">
                  This date is marked as a holiday. No teaching will occur on
                  this day.
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="bg-green-50 rounded-xl p-4 sm:p-5">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {presentCount}
              </div>
              <div className="text-sm text-green-700 font-medium mt-1">Present</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 sm:p-5">
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {absentCount}
              </div>
              <div className="text-sm text-red-700 font-medium mt-1">Absent</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 sm:p-5">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                {Math.max(0, totalStudents - totalMarked)}
              </div>
              <div className="text-sm text-orange-700 font-medium mt-1">Unmarked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past date locked warning */}
      {isPastDateLocked && (
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-base sm:text-sm font-semibold text-amber-800">
            Attendance already marked for this date. Past attendance cannot be edited.
          </p>
        </div>
      )}

      {/* Student List */}
      <div className="space-y-3">
        {isHoliday ? (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-8 text-center">
              <PartyPopper className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-700 mb-2">
                Holiday - No Teaching
              </h3>
              <p className="text-purple-600">
                This date is marked as a holiday. Attendance cannot be marked on
                holidays.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-center">Present</th>
                  <th className="px-3 py-2 text-center">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cohortData.cohort.students.map((student) => {
                  const currentStatus = attendanceRecords[student._id];
                  return (
                    <tr
                      key={student._id}
                      className={
                        currentStatus === "present"
                          ? "bg-green-50"
                          : currentStatus === "absent"
                          ? "bg-red-50"
                          : ""
                      }
                    >
                      <td className="px-3 py-2 align-middle">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/reports/student/${student._id}`)}
                            className="font-medium text-primary hover:underline text-left whitespace-normal break-words sm:truncate"
                          >
                            {student.name}
                          </button>
                          <p className="hidden sm:block text-xs text-gray-600 truncate">
                            Roll No: {student.roll_no} • Class: {student.class}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        <Button
                          variant={currentStatus === "present" ? "default" : "outline"}
                          size="sm"
                          disabled={isPastDateLocked || isHoliday}
                          onClick={() => handleStatusChange(student._id, "present")}
                          className={currentStatus === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        <Button
                          variant={currentStatus === "absent" ? "destructive" : "outline"}
                          size="sm"
                          disabled={isPastDateLocked || isHoliday}
                          onClick={() => handleStatusChange(student._id, "absent")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                {totalMarked} of {totalStudents} students marked
              </div>
              <Button
                onClick={saveAttendance}
                disabled={saving || totalMarked === 0 || isHoliday || isPastDateLocked}
                className="w-full sm:w-auto px-6 sm:px-8"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Save Attendance</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stable empty array to prevent useEffect infinite loops from unstable [] default
const EMPTY_ATTENDANCE: never[] = [];

// Individual Attendance Component
function IndividualAttendance() {
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<
    Map<string, AttendanceStatus>
  >(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({ open: false, title: "", description: "" });
  const confirmResolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const showConfirm = useCallback((title: string, description: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmDialog({ open: true, title, description });
    });
  }, []);

  const handleConfirmResult = useCallback((confirmed: boolean) => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    confirmResolveRef.current?.(confirmed);
    confirmResolveRef.current = null;
  }, []);

  const schoolId =
    isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;

  // Fetch programs to get dynamic subjects
  const { data: programsData } = useQuery({
    queryKey: ["programs-for-attendance", schoolId],
    queryFn: () => programsService.getPrograms({ limit: 100, schoolId }),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
  });

  // Get all programs with their names
  const availablePrograms = useMemo(() => {
    const programs = programsData?.programs || [];
    return programs
      .filter((p: any) => p.subject)
      .map((p: any) => ({ id: p._id, name: p.name, subject: p.subject.toLowerCase() }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [programsData]);

  // Fetch all students for this school
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students", schoolId],
    queryFn: () => getStudents(schoolId),
    enabled: !!schoolId,
  });

  // Fetch existing attendance for selected date + subject
  const { data: existingAttendance = EMPTY_ATTENDANCE, isLoading: loadingAttendance } =
    useQuery({
      queryKey: [
        "attendance-records",
        schoolId,
        selectedDate,
        selectedSubject,
      ],
      queryFn: () =>
        getAttendanceRecords({
          schoolId,
          date: selectedDate,
          subject: selectedSubject as "math" | "hindi" | "english",
        }),
      enabled: !!schoolId && !!selectedSubject,
    });

  // Initialize attendance map from existing records when data loads
  useEffect(() => {
    const map = new Map<string, AttendanceStatus>();
    existingAttendance.forEach((record) => {
      const studentId =
        typeof record.student === "string"
          ? record.student
          : record.student._id;
      map.set(studentId, record.status);
    });
    setAttendanceMap(map);
    setHasChanges(false);
  }, [existingAttendance]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const records = Array.from(attendanceMap.entries()).map(
        ([studentId, status]) => ({
          studentId,
          status,
          subject: selectedSubject as "math" | "hindi" | "english",
        })
      );
      return bulkMarkAttendance({
        attendanceRecords: records,
        schoolId: schoolId!,
        date: selectedDate,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success(`Attendance saved: ${data.success} students`);
      setHasChanges(false);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to save attendance"));
    },
  });

  // Toggle attendance for a student
  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      const next = new Map(prev);
      // If same status clicked again, remove it (unmark)
      if (next.get(studentId) === status) {
        next.delete(studentId);
      } else {
        next.set(studentId, status);
      }
      return next;
    });
    setHasChanges(true);
  };

    // Auto-select subject based on class name
  useEffect(() => {
    if (selectedClass && availablePrograms.length > 0) {
      const classNumber = selectedClass.match(/\d+/)?.[0];
      if (classNumber) {
        const matchingProgram = availablePrograms.find((p) =>
          p.name.startsWith(classNumber)
        );
        if (matchingProgram) {
          setSelectedProgramId(matchingProgram.id);
          setSelectedSubject(matchingProgram.subject);
        }
      }
    }
  }, [selectedClass, availablePrograms]);

  // Get unique class list from students
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    students.forEach((s) => {
      if (s.class) classes.add(s.class);
    });
    return Array.from(classes).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [students]);

  // Filter students by class and search
  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (selectedClass) {
      filtered = filtered.filter((s) => s.class === selectedClass);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.roll_no?.toLowerCase().includes(q) ||
          s.class?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [students, selectedClass, searchQuery]);

  const markedCount = attendanceMap.size;
  const presentCount = Array.from(attendanceMap.values()).filter(
    (s) => s === "present"
  ).length;
  const absentCount = Array.from(attendanceMap.values()).filter(
    (s) => s === "absent"
  ).length;

  // Check if selected date is in the past and already has attendance
  const todayLocalClass = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })();
  const isToday = selectedDate === todayLocalClass;
  const isPastDateClass = !isToday && selectedDate < todayLocalClass;
  const pastDateHasAttendance = isPastDateClass && existingAttendance.length > 0;
  const isPastDateLocked = pastDateHasAttendance;

  // Get student count per class
  const classStudentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      if (s.class) {
        counts[s.class] = (counts[s.class] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  // If no class selected, show class cards
  if (!selectedClass) {
    return (
      <div className="space-y-4">
        <p className="text-base text-muted-foreground">Select a class to mark attendance</p>
        {loadingStudents ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {availableClasses.map((cls) => (
              <Card
                key={cls}
                className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                onClick={() => setSelectedClass(cls)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Class {cls}</p>
                    <p className="text-sm text-muted-foreground">{classStudentCounts[cls] || 0} students</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            ))}
            {availableClasses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No classes found</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button + Class name */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => {
          if (hasChanges) {
            showConfirm("Unsaved Changes", "You have unsaved attendance changes. Going back will discard them. Continue?")
              .then((confirmed) => { if (confirmed) { setSelectedClass(""); setHasChanges(false); } });
          } else {
            setSelectedClass("");
          }
        }}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <span className="text-lg font-semibold">Class {selectedClass}</span>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col gap-4">
        {/* Subject Tabs */}
        <div className="flex gap-2 flex-wrap">
          {availablePrograms.length > 0 ? (
            availablePrograms.map((program: any) => (
              <Button
                key={program.id}
                variant={selectedProgramId === program.id ? "default" : "outline"}
                size="sm"
                onClick={async () => {
                  if (hasChanges) {
                    const confirmed = await showConfirm(
                      "Unsaved Changes",
                      "You have unsaved attendance changes. Switching subject will discard them. Continue?"
                    );
                    if (!confirmed) return;
                  }
                  setSelectedProgramId(program.id);
                  setSelectedSubject(program.subject);
                }}
              >
                {program.name} ({program.subject.charAt(0).toUpperCase() + program.subject.slice(1)})
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No subjects available</p>
          )}
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={async (e) => {
              const newDate = e.target.value;
              if (hasChanges) {
                const confirmed = await showConfirm(
                  "Unsaved Changes",
                  "You have unsaved attendance changes. Switching date will discard them. Continue?"
                );
                if (!confirmed) return;
              }
              const selected = new Date(newDate);
              if (selected.getDay() === 0) {
                toast.error(
                  "Sunday is a holiday. Please select a teaching day (Monday-Saturday)."
                );
                return;
              }
              setSelectedDate(newDate);
            }}
            onFocus={(e) => {
              const now = new Date();
              const toLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const weekAgo = new Date(now);
              weekAgo.setDate(weekAgo.getDate() - 7);
              e.currentTarget.min = toLocal(weekAgo);
              e.currentTarget.max = toLocal(now);
            }}
            className="px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            style={{ position: 'relative' }}
          />
        </div>
      </div>

      {/* No subject selected */}
      {!selectedSubject && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-xl sm:text-lg font-medium text-muted-foreground">
              Select a subject to mark attendance
            </p>
          </CardContent>
        </Card>
      )}

      {/* Past date locked warning */}
      {isPastDateLocked && selectedSubject && (
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-base sm:text-sm font-semibold text-amber-800">
            Attendance already marked for this date. Past attendance cannot be edited.
          </p>
        </div>
      )}

      {/* Students List */}
      {selectedSubject && (
        <>
          {/* Search + Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Loading */}
          {(loadingStudents || loadingAttendance) && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Student Cards */}
          {!loadingStudents && !loadingAttendance && (
            <div>
              {filteredStudents.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No students found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-center">Present</th>
                        <th className="px-3 py-2 text-center">Absent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredStudents.map((student) => {
                        const status = attendanceMap.get(student._id || "");
                        return (
                          <tr
                            key={student._id}
                            className={
                              status === "present"
                                ? "bg-green-50"
                                : status === "absent"
                                ? "bg-red-50"
                                : ""
                            }
                          >
                            <td className="px-3 py-2 align-middle">
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/reports/student/${student._id}`)}
                                  className="font-medium text-primary hover:underline text-left whitespace-normal break-words sm:truncate"
                                >
                                  {student.name}
                                </button>
                                <p className="hidden sm:block text-xs text-gray-600 truncate">
                                  Roll No: {student.roll_no} • Class: {student.class}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <Button
                                variant={status === "present" ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleAttendance(student._id || "", "present")}
                                disabled={isPastDateLocked}
                                className={status === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Present
                              </Button>
                            </td>
                            <td className="px-3 py-2 text-center align-middle">
                              <Button
                                variant={status === "absent" ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => toggleAttendance(student._id || "", "absent")}
                                disabled={isPastDateLocked}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Absent
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Bottom Sticky Save Bar */}
          {selectedSubject && filteredStudents.length > 0 && (
            <div className="sticky bottom-0 bg-background border-t pt-3 pb-2 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{markedCount}</span> of{" "}
                {filteredStudents.length} marked
                {markedCount > 0 && (
                  <span className="ml-2">
                    (<span className="text-green-600">{presentCount} P</span> /{" "}
                    <span className="text-red-600">{absentCount} A</span>)
                  </span>
                )}
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={
                  !hasChanges || markedCount === 0 || saveMutation.isPending || isPastDateLocked
                }
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Attendance
              </Button>
            </div>
          )}
        </>
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => {
        if (!open) handleConfirmResult(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmResult(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmResult(true)} className="bg-destructive hover:bg-destructive/90">
              Discard & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Main Attendance Management Component
export default function AttendanceManagement() {
  const { cohortId } = useParams<{ cohortId?: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"group" | "individual">("individual");

  // If cohortId is present, show detail view; otherwise show overview
  if (cohortId) {
    return <CohortAttendanceDetail />;
  }

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 flex-shrink-0" />
          {t("attendance.title")}
        </h1>
        {activeTab === "group" && (
          <div className="mt-2 p-2.5 sm:p-2 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-sm font-semibold text-red-700">
              A group must have tutor assigned to mark attendance.
            </span>
          </div>
        )}
      </div>

      {/* Toggle: Group / Individual */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "individual" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("individual")}
          className="gap-2 h-10 sm:h-9 text-base sm:text-sm px-4"
        >
          <User className="h-5 w-5 sm:h-4 sm:w-4" />
          Class
        </Button>
        <Button
          variant={activeTab === "group" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("group")}
          className="gap-2 h-10 sm:h-9 text-base sm:text-sm px-4"
        >
          <Users className="h-5 w-5 sm:h-4 sm:w-4" />
          Group
        </Button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "group" ? <AttendanceOverview /> : <IndividualAttendance />}
    </div>
  );
}
