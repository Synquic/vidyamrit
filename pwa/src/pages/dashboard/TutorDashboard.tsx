import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  Users,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
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
import { getTutorAvgAttendance } from "@/services/attendance";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

export default function TutorDashboard() {
  const { user } = useAuth();
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();

  const [progressData, setProgressData] = useState<TutorProgressSummary[]>([]);
  const [avgAttendance, setAvgAttendance] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    const schoolId =
      isSchoolContextActive && selectedSchool
        ? selectedSchool._id
        : undefined;
    fetchProgressData(schoolId);
    fetchAvgAttendance(schoolId);
  }, [selectedSchool, isSchoolContextActive]);

  const fetchProgressData = async (schoolId?: string) => {
    try {
      setLoadingProgress(true);
      const data = await getTutorProgressSummary(schoolId);
      setProgressData(data);
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to load progress data");
    } finally {
      setLoadingProgress(false);
    }
  };

  const fetchAvgAttendance = async (schoolId?: string) => {
    try {
      setLoadingAttendance(true);
      const data = await getTutorAvgAttendance(7, schoolId);
      setAvgAttendance(data.avgAttendanceRate);
    } catch (error) {
      console.error("Error fetching avg attendance:", error);
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

    return { totalStudents, activeGroups };
  }, [progressData]);

  const isLoading = loadingProgress || loadingAttendance;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {/* Skeleton for header */}
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-48" />
        {/* Skeleton for stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
          ))}
        </div>
        {/* Skeleton for sections */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
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
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
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

        {/* Avg Attendance (7d) */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-green-500/10">
                <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-green-700">
                  {avgAttendance}%
                </p>
                <p className="text-sm sm:text-base text-green-600/80 font-medium mt-0.5">
                  Avg Attendance (7d)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups Progress */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* My Groups Progress */}
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

      {/* Empty state when no data at all */}
      {progressData.length === 0 && (
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
