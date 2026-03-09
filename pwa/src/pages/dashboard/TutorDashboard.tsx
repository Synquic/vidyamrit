import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  Users,
  GraduationCap,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ClipboardCheck,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTutorProgressSummary,
  TutorProgressSummary,
} from "@/services/progress";
import {
  getTutorAttendanceSummary,
  TutorAttendanceSummary,
} from "@/services/attendance";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { toast } from "sonner";

export default function TutorDashboard() {
  const { user } = useAuth();
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();

  const [progressData, setProgressData] = useState<TutorProgressSummary[]>([]);
  const [attendanceData, setAttendanceData] = useState<
    TutorAttendanceSummary[]
  >([]);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchProgressData();
    fetchAttendanceData();
  }, [selectedSchool, isSchoolContextActive]);

  const fetchProgressData = async () => {
    try {
      setLoadingProgress(true);
      const schoolId =
        isSchoolContextActive && selectedSchool
          ? selectedSchool._id
          : undefined;
      const data = await getTutorProgressSummary(schoolId);
      setProgressData(data);
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to load progress data");
    } finally {
      setLoadingProgress(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoadingAttendance(true);
      const schoolId =
        isSchoolContextActive && selectedSchool
          ? selectedSchool._id
          : undefined;
      const data = await getTutorAttendanceSummary(today, schoolId);
      const validData = data.filter(
        (s) => s && s.cohort && s.cohort._id && s.attendance
      );
      setAttendanceData(validData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const totalStudents = progressData.reduce(
      (sum, s) => sum + s.summary.totalStudents,
      0
    );
    const activeGroups = progressData.length;

    const totalPresent = attendanceData.reduce(
      (sum, s) => sum + s.attendance.presentCount,
      0
    );
    const totalMarked = attendanceData.reduce(
      (sum, s) => sum + s.attendance.markedCount,
      0
    );
    const todayAttendanceRate =
      totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

    const upcomingTests = progressData.filter(
      (s) =>
        s.timeTracking &&
        s.timeTracking.daysUntilNextAssessment >= 0 &&
        s.timeTracking.daysUntilNextAssessment <= 7
    ).length;

    return { totalStudents, activeGroups, todayAttendanceRate, upcomingTests };
  }, [progressData, attendanceData]);

  // Groups needing test soon (within 7 days)
  const testAlerts = useMemo(() => {
    return progressData
      .filter((s) => s.timeTracking && s.timeTracking.daysUntilNextAssessment <= 7)
      .sort(
        (a, b) =>
          (a.timeTracking?.daysUntilNextAssessment ?? 99) -
          (b.timeTracking?.daysUntilNextAssessment ?? 99)
      );
  }, [progressData]);

  const isLoading = loadingProgress || loadingAttendance;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {/* Skeleton for header */}
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-48" />
        {/* Skeleton for stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
          ))}
        </div>
        {/* Skeleton for sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-2 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
          <LayoutDashboard className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
          Dashboard
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mt-1">
          Welcome back, {user?.name}!
        </p>
      </div>

      {/* Section 1: Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-500/10">
                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">
                  {stats.totalStudents}
                </p>
                <p className="text-sm sm:text-base text-blue-600/80 font-medium mt-0.5">
                  Total Students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Groups */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500/10">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                  {stats.activeGroups}
                </p>
                <p className="text-sm sm:text-base text-purple-600/80 font-medium mt-0.5">
                  Active Groups
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-green-500/10">
                <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-green-700">
                  {stats.todayAttendanceRate}%
                </p>
                <p className="text-sm sm:text-base text-green-600/80 font-medium mt-0.5">
                  Today's Attendance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tests */}
        <Card
          className={`border-0 shadow-sm rounded-2xl ${
            stats.upcomingTests > 0
              ? "bg-gradient-to-br from-orange-50 to-red-100/50"
              : "bg-gradient-to-br from-gray-50 to-gray-100/50"
          }`}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div
                className={`p-2.5 sm:p-3 rounded-xl ${
                  stats.upcomingTests > 0
                    ? "bg-orange-500/10"
                    : "bg-gray-500/10"
                }`}
              >
                <ClipboardCheck
                  className={`h-6 w-6 sm:h-7 sm:w-7 ${
                    stats.upcomingTests > 0
                      ? "text-orange-600"
                      : "text-gray-500"
                  }`}
                />
              </div>
              <div className="text-center sm:text-left">
                <p
                  className={`text-2xl sm:text-3xl font-bold ${
                    stats.upcomingTests > 0
                      ? "text-orange-700"
                      : "text-gray-600"
                  }`}
                >
                  {stats.upcomingTests}
                </p>
                <p
                  className={`text-sm sm:text-base font-medium mt-0.5 ${
                    stats.upcomingTests > 0
                      ? "text-orange-600/80"
                      : "text-gray-500"
                  }`}
                >
                  Tests Due Soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2 & 3: Attendance & Progress side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Section 2: Today's Attendance Overview */}
        <Card className="rounded-2xl shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Today's Attendance
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to="/attendance"
                  className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendanceData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-base">
                  No groups found for attendance
                </p>
              </div>
            ) : (
              attendanceData.map((summary) => {
                const isFullyMarked = summary.attendance.unmarkedCount === 0;
                const rate = summary.attendance.attendanceRate;
                return (
                  <div
                    key={summary.cohort._id}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-colors ${
                      isFullyMarked
                        ? "bg-green-50/50 border-green-200"
                        : "bg-orange-50/50 border-orange-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isFullyMarked ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        )}
                        <p className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                          {summary.cohort.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-7 text-sm sm:text-base text-gray-600">
                        <span className="text-green-700 font-medium">
                          {summary.attendance.presentCount}P
                        </span>
                        <span className="text-red-600 font-medium">
                          {summary.attendance.absentCount}A
                        </span>
                        {summary.attendance.unmarkedCount > 0 && (
                          <span className="text-orange-600 font-medium">
                            {summary.attendance.unmarkedCount} unmarked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {isFullyMarked ? (
                        <Badge
                          variant="outline"
                          className={`text-sm font-bold px-2.5 py-1 ${
                            rate >= 90
                              ? "bg-green-100 text-green-700 border-green-300"
                              : rate >= 75
                              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                              : "bg-red-100 text-red-700 border-red-300"
                          }`}
                        >
                          {rate.toFixed(0)}%
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          asChild
                          className="h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base rounded-lg bg-orange-600 hover:bg-orange-700"
                        >
                          <Link
                            to={`/attendance/cohort/${summary.cohort._id}`}
                          >
                            Mark
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Section 3: My Groups Progress */}
        <Card className="rounded-2xl shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Groups Progress
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to="/progress/tutor"
                  className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {progressData.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-base">
                  No groups assigned yet
                </p>
              </div>
            ) : (
              progressData.map((summary) => {
                const {
                  progressCounts,
                  totalStudents,
                  studentsNeedingAttention,
                } = summary.summary;
                const onTrackPercent =
                  totalStudents > 0
                    ? Math.round(
                        (progressCounts.green / totalStudents) * 100
                      )
                    : 0;

                // Determine dominant status color
                let statusColor = "bg-green-500";
                let statusBg = "bg-green-50 border-green-200";
                if (progressCounts.red > 0) {
                  statusColor = "bg-red-500";
                  statusBg = "bg-red-50 border-red-200";
                } else if (progressCounts.orange > 0) {
                  statusColor = "bg-orange-500";
                  statusBg = "bg-orange-50 border-orange-200";
                } else if (progressCounts.yellow > 0) {
                  statusColor = "bg-yellow-500";
                  statusBg = "bg-yellow-50 border-yellow-200";
                }

                return (
                  <Link
                    key={summary.cohort._id}
                    to={`/progress/cohort/${summary.cohort._id}`}
                    className={`block p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md ${statusBg}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColor}`}
                        />
                        <p className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                          {summary.cohort.name}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs sm:text-sm ml-2 flex-shrink-0"
                      >
                        {totalStudents} students
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>On track</span>
                        <span className="font-medium">{onTrackPercent}%</span>
                      </div>
                      <Progress value={onTrackPercent} className="h-2" />
                    </div>

                    {/* Status counts */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-green-700 font-medium">
                          {progressCounts.green}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-yellow-700 font-medium">
                          {progressCounts.yellow}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-orange-700 font-medium">
                          {progressCounts.orange}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-700 font-medium">
                          {progressCounts.red}
                        </span>
                      </span>
                      {studentsNeedingAttention > 0 && (
                        <span className="ml-auto text-orange-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {studentsNeedingAttention} need help
                        </span>
                      )}
                    </div>

                    {/* Level info */}
                    {summary.cohort.program && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <span>
                          {summary.cohort.program.subject} - Level{" "}
                          {summary.cohort.currentLevel || 1}/
                          {summary.cohort.program.totalLevels}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Test Alerts */}
      {testAlerts.length > 0 && (
        <Card className="rounded-2xl shadow-sm border-orange-200 bg-gradient-to-br from-orange-50/50 to-red-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Test Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {testAlerts.map((summary) => {
              const days = summary.timeTracking?.daysUntilNextAssessment ?? 0;
              const isOverdue = days < 0;
              const isUrgent = days <= 2;
              const isReady =
                summary.levelProgress?.isReadyForAssessment ?? false;
              const completionPct =
                summary.levelProgress?.completionPercentage ?? 0;

              return (
                <div
                  key={summary.cohort._id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-xl border ${
                    isOverdue
                      ? "bg-red-50 border-red-300"
                      : isUrgent
                      ? "bg-orange-50 border-orange-300"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-base sm:text-lg text-gray-900">
                        {summary.cohort.name}
                      </p>
                      {isReady && (
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                          Ready for Test
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span>{summary.summary.totalStudents} students</span>
                      <span>Level {summary.cohort.currentLevel || 1}</span>
                      <span>{completionPct.toFixed(0)}% complete</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-sm font-bold px-3 py-1 ${
                        isOverdue
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : isUrgent
                          ? "bg-orange-600 text-white hover:bg-orange-700"
                          : "bg-yellow-500 text-white hover:bg-yellow-600"
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(days)} days overdue`
                        : days === 0
                        ? "Due today"
                        : `${days} days left`}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-9 sm:h-10 rounded-lg"
                    >
                      <Link
                        to={`/progress/cohort/${summary.cohort._id}`}
                      >
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty state when no data at all */}
      {progressData.length === 0 && attendanceData.length === 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="text-center py-12">
            <LayoutDashboard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Data Yet
            </h3>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Once you have groups assigned and students enrolled, your
              dashboard will show attendance, progress, and test alerts here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
