import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
  Timer,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getTutorProgressSummary,
  getCohortProgress,
  ProgressStatus,
} from "@/services/progress";
import { toast } from "sonner";
import { Link } from "react-router";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { getApiErrorMessage } from "@/services";
import { checkAssessmentReadiness, getCohorts } from "@/services/cohorts";

// Overview Component (TutorProgress functionality)
function ProgressOverview() {
  const { t } = useTranslation();

  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const schoolId =
    isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;

  const { data: progressSummary = [], isLoading: loading } = useQuery({
    queryKey: ["tutor-progress-summary", schoolId],
    queryFn: async () => {
      try {
        const data = await getTutorProgressSummary(schoolId);
        return data;
      } catch (error) {
        console.error("Error fetching progress summary:", error);
        toast.error(getApiErrorMessage(error, "Failed to load progress summary"));
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch cohorts to check start status
  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts-for-progress", schoolId],
    queryFn: () => getCohorts(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper function to check if cohort has started
  const isCohortStarted = (cohortId: string): boolean => {
    const cohort = cohorts.find(c => c._id === cohortId);
    if (!cohort) return false;
    return !!(
      cohort.timeTracking?.cohortStartDate ||
      cohort.startDate ||
      (cohort.timeTracking?.cohortStartDate && new Date(cohort.timeTracking.cohortStartDate).getTime() > 0)
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "green":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "yellow":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "orange":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "red":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
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

  const totalStudents = progressSummary.reduce(
    (sum, s) => sum + s.summary.totalStudents,
    0
  );
  const overallProgressCounts = progressSummary.reduce(
    (acc, summary) => {
      acc.green += summary.summary.progressCounts.green;
      acc.yellow += summary.summary.progressCounts.yellow;
      acc.orange += summary.summary.progressCounts.orange;
      acc.red += summary.summary.progressCounts.red;
      return acc;
    },
    { green: 0, yellow: 0, orange: 0, red: 0 }
  );

  const timeMetrics = progressSummary.reduce(
    (acc, summary) => {
      if (summary.timeTracking) {
        acc.totalCohorts += 1;
        acc.cohortsNearingAssessment +=
          summary.timeTracking.daysUntilNextAssessment <= 7 ? 1 : 0;
        acc.cohortsOverdue +=
          summary.timeTracking.daysUntilNextAssessment < 0 ? 1 : 0;
        acc.averageProgress +=
          (summary.timeTracking.elapsedWeeks /
            summary.timeTracking.totalDurationWeeks) *
          100;
      }
      return acc;
    },
    {
      totalCohorts: 0,
      cohortsNearingAssessment: 0,
      cohortsOverdue: 0,
      averageProgress: 0,
    }
  );

  if (timeMetrics.totalCohorts > 0) {
    timeMetrics.averageProgress =
      timeMetrics.averageProgress / timeMetrics.totalCohorts;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span>Group Overview</span>
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          Monitor student progress across all groups
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700 tracking-tight">
                {totalStudents}
              </p>
              <p className="text-xs sm:text-sm text-blue-700/70 font-medium">
                Total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100/50 border-green-200/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-700 tracking-tight">
                {overallProgressCounts.green}
              </p>
              <p className="text-xs sm:text-sm text-green-700/70 font-medium">
                Progressing
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100/50 border-red-200/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-700 tracking-tight">
                {overallProgressCounts.yellow + overallProgressCounts.orange + overallProgressCounts.red}
              </p>
              <p className="text-xs sm:text-sm text-red-700/70 font-medium">
                Not Progressing
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-orange-700 tracking-tight">
                {timeMetrics.cohortsNearingAssessment}
              </p>
              <p className="text-xs sm:text-sm text-orange-700/70 font-medium">
                Test Soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time-based Overview */}
      {timeMetrics.totalCohorts > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
              <span className="truncate">Program Timeline Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                  {timeMetrics.averageProgress.toFixed(1)}%
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Average Progress
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {timeMetrics.cohortsNearingAssessment}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Tests Due (7 days)
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {timeMetrics.cohortsOverdue}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Overdue Tests
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cohort Progress Table */}
      {progressSummary.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t("progress.noCohorts")}</p>
            <p className="text-gray-400 text-sm mt-2">
              {t("progress.noCohortsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto -mx-2 sm:mx-0">
          <div className="min-w-full inline-block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px] sm:min-w-[200px]">
                    Group
                  </TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">
                    School
                  </TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">
                    Program
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Students
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Level</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">
                    Progress
                  </TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressSummary.map((summary) => {
                  const progressPercentage =
                    summary.summary.totalStudents > 0
                      ? (summary.summary.progressCounts.green /
                          summary.summary.totalStudents) *
                        100
                      : 0;

                  return (
                    <TableRow key={summary.cohort._id}>
                      <TableCell className="min-w-[180px] sm:min-w-[200px]">
                        <div className="space-y-1">
                          <div className="font-medium text-sm sm:text-base truncate">
                            {summary.cohort.name}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden truncate">
                            {summary.cohort.school?.name ||
                              "School not assigned"}
                          </div>
                          <div className="flex flex-wrap gap-1 md:hidden">
                            <Badge variant="secondary" className="text-xs">
                              {summary.cohort.program?.subject || "No Program"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {summary.summary.totalStudents} students
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm truncate max-w-[150px]">
                          {summary.cohort.school?.name || "School not assigned"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {summary.cohort.program?.subject || "No Program"}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {summary.cohort.program?.totalLevels || 0} Levels
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm font-medium">
                          {summary.summary.totalStudents}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Level {summary.cohort.currentLevel || 1}
                          </div>
                          {summary.levelProgress && (
                            <div className="text-xs text-muted-foreground">
                              {summary.levelProgress.completionPercentage.toFixed(
                                0
                              )}
                              % complete
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1 min-w-[100px]">
                          <Progress
                            value={progressPercentage}
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {progressPercentage.toFixed(0)}% on track
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            {getStatusIcon("green")}
                            <span className="text-xs">
                              {summary.summary.progressCounts.green} Progressing
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon("red")}
                            <span className="text-xs">
                              {summary.summary.progressCounts.yellow + summary.summary.progressCounts.orange + summary.summary.progressCounts.red} Not Progressing
                            </span>
                          </div>
                          {summary.summary.studentsNeedingAttention > 0 && (
                            <Badge
                              variant="destructive"
                              className="text-xs mt-1 w-fit"
                            >
                              {summary.summary.studentsNeedingAttention} need
                              attention
                            </Badge>
                          )}
                          {summary.levelProgress?.isReadyForAssessment && (
                            <Badge
                              variant="default"
                              className="text-xs mt-1 w-fit bg-green-600"
                            >
                              Ready for Test
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right min-w-[80px]">
                        {isCohortStarted(summary.cohort._id) ? (
                          <Button
                            asChild
                            size="sm"
                            variant={
                              summary.summary.studentsNeedingAttention > 0
                                ? "default"
                                : "outline"
                            }
                            className="w-full sm:w-auto"
                          >
                            <Link to={`/progress/cohort/${summary.cohort._id}`}>
                              <span className="hidden sm:inline">View</span>
                              <span className="sm:hidden">→</span>
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Not Started
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// Cohort Detail Component (CohortProgress functionality)
function CohortProgressDetail() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();

  const { data: cohortData, isLoading: loading } = useQuery({
    queryKey: ["cohort-progress", cohortId],
    queryFn: async () => {
      try {
        const data = await getCohortProgress(cohortId!);
        return data;
      } catch (error) {
        console.error("Error fetching cohort progress:", error);
        toast.error(getApiErrorMessage(error, "Failed to load group progress"));
        return null;
      }
    },
    enabled: !!cohortId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch assessment readiness
  const { data: assessmentReadiness } = useQuery({
    queryKey: ["assessment-readiness", cohortId],
    queryFn: async () => {
      try {
        if (!cohortId) return null;
        const data = await checkAssessmentReadiness(cohortId);
        return data;
      } catch (error) {
        console.error("Error fetching assessment readiness:", error);
        return null;
      }
    },
    enabled: !!cohortId && !!cohortData?.cohort.program,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

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
                  <Skeleton className="h-6 w-16" />
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
        <Button onClick={() => navigate("/cohorts")} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const progressCounts = cohortData.studentsProgress.reduce(
    (acc, student) => {
      acc[student.progress.status]++;
      return acc;
    },
    { green: 0, yellow: 0, orange: 0, red: 0 } as Record<ProgressStatus, number>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cohorts")}
          className="p-2 self-start sm:self-auto -ml-2 sm:ml-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0" />
            <span className="truncate">{cohortData.cohort.name} Progress</span>
          </h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Progressing
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {progressCounts.green}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Not Progressing
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {progressCounts.yellow + progressCounts.orange + progressCounts.red}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Auto Progress - Simple days counter */}
      {assessmentReadiness && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm sm:text-base">Level {assessmentReadiness.currentLevel} Progress</h3>
              <span className="text-sm text-muted-foreground">
                {assessmentReadiness.completionPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  assessmentReadiness.isReadyForAssessment ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(100, assessmentReadiness.completionPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{assessmentReadiness.weeksCompleted} weeks completed</span>
              <span>{assessmentReadiness.weeksRequired} weeks required</span>
            </div>
            {assessmentReadiness.daysRemaining && (
              <p className="text-sm text-muted-foreground mt-2">
                {assessmentReadiness.daysRemaining} teaching days remaining
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Progress Table */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 sm:p-4 text-sm font-semibold">Name</th>
                  <th className="text-center p-3 sm:p-4 text-sm font-semibold">Status</th>
                  <th className="text-center p-3 sm:p-4 text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.studentsProgress.map((studentData) => {
                  const { student, progress } = studentData;
                  const isReady = assessmentReadiness?.isReadyForAssessment;

                  return (
                    <tr key={student._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3 sm:p-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/reports/student/${student._id}`)}
                          className="font-medium text-sm text-primary hover:underline cursor-pointer text-left"
                        >
                          {student.name}
                        </button>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <Badge
                          variant={progress.status === "green" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {progress.status === "green" ? "Progressing" : "Not Progressing"}
                        </Badge>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <Button
                          size="sm"
                          disabled={!isReady}
                          className={isReady ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => {
                            if (isReady) {
                              navigate(`/progress/cohort/${cohortId}/level-assessment?studentId=${student._id}&studentName=${encodeURIComponent(student.name)}`);
                            }
                          }}
                        >
                          {isReady ? "Start Test" : "Not Ready"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Progress Management Component
export default function ProgressManagement() {
  const { cohortId } = useParams<{ cohortId?: string }>();
  const { t } = useTranslation();

  // If cohortId is present, show detail view; otherwise show overview
  if (cohortId) {
    return <CohortProgressDetail />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Main Header */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0" />
          <span>{t("progress.title")}</span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
          {t("progress.subtitle")}
        </p>
      </div>

      {/* Overview Content */}
      <ProgressOverview />
    </div>
  );
}
