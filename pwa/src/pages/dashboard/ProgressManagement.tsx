import {} from "react";
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
  getTutorProgressSummary,
  getCohortProgress,
  getProgressStatusDescription,
  ProgressStatus,
} from "@/services/progress";
import { TimelineProgress } from "@/components/progress/TimelineProgress";
import { toast } from "sonner";
import { Link } from "react-router";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { checkAssessmentReadiness } from "@/services/cohorts";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        toast.error("Failed to load progress summary");
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cohort Overview
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Monitor student progress across all cohorts
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">On Track</p>
                <p className="text-2xl font-bold text-green-600">
                  {overallProgressCounts.green}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Need Support</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {overallProgressCounts.yellow + overallProgressCounts.orange}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Assessment Soon</p>
                <p className="text-2xl font-bold text-orange-600">
                  {timeMetrics.cohortsNearingAssessment}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Urgent Attention</p>
                <p className="text-2xl font-bold text-red-600">
                  {overallProgressCounts.red}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time-based Overview */}
      {timeMetrics.totalCohorts > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Program Timeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  Assessments Due (7 days)
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {timeMetrics.cohortsOverdue}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Overdue Assessments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cohort Progress Cards */}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {progressSummary.map((summary) => {
            const progressPercentage =
              summary.summary.totalStudents > 0
                ? (summary.summary.progressCounts.green /
                    summary.summary.totalStudents) *
                  100
                : 0;

            return (
              <Card
                key={summary.cohort._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="truncate">{summary.cohort.name}</span>
                    <Badge
                      variant="outline"
                      className="ml-0 sm:ml-2 self-start sm:self-auto"
                    >
                      {summary.summary.totalStudents} students
                    </Badge>
                  </CardTitle>
                  <div className="space-y-1 mt-2">
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {summary.cohort.school?.name || "School not assigned"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {summary.cohort.program?.subject || "No Program"}{" "}
                        Program
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {summary.cohort.program?.totalLevels || 0} Levels
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Enhanced Time Tracking Section */}
                  {summary.timeTracking ? (
                    <TimelineProgress
                      timeTracking={{
                        ...summary.timeTracking,
                        currentLevelTimeframe:
                          summary.timeTracking.currentLevelTimeframe ||
                          undefined,
                      }}
                      programName={summary.cohort.program?.name}
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">
                        ⏱️ Enhanced time tracking available when program is
                        assigned
                      </p>
                    </div>
                  )}

                  {/* Level Progress Section */}
                  {summary.levelProgress && summary.cohort.program && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Level {summary.cohort.currentLevel || 1} Progress
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {summary.levelProgress.weeksCompleted.toFixed(1)} /{" "}
                          {summary.levelProgress.weeksRequired} weeks
                        </Badge>
                      </div>

                      {/* Level Progress Bar */}
                      <div className="space-y-1">
                        <Progress
                          value={summary.levelProgress.completionPercentage}
                          className="h-3"
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>
                            {summary.levelProgress.completionPercentage.toFixed(
                              0
                            )}
                            % Complete
                          </span>
                          {!summary.levelProgress.isReadyForAssessment &&
                            summary.levelProgress.daysRemaining && (
                              <span>
                                {summary.levelProgress.daysRemaining} teaching
                                days remaining
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Assessment Readiness Alert */}
                      {summary.levelProgress.isReadyForAssessment ? (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">
                            Ready for Assessment
                          </AlertTitle>
                          <AlertDescription className="text-green-700 text-sm">
                            This cohort has completed Level{" "}
                            {summary.cohort.currentLevel || 1}. Conduct a
                            level-specific assessment to verify student mastery
                            before progressing to the next level.
                          </AlertDescription>
                          <div className="mt-2">
                            <Link to={`/progress/cohort/${summary.cohort._id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-300 text-green-700 hover:bg-green-100"
                              >
                                View Cohort Details
                              </Button>
                            </Link>
                          </div>
                        </Alert>
                      ) : summary.levelProgress.completionPercentage >= 80 ? (
                        <Alert className="border-orange-200 bg-orange-50">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <AlertTitle className="text-orange-800">
                            Assessment Approaching
                          </AlertTitle>
                          <AlertDescription className="text-orange-700 text-sm">
                            This cohort is{" "}
                            {summary.levelProgress.completionPercentage.toFixed(
                              0
                            )}
                            % through Level {summary.cohort.currentLevel || 1}.
                            Assessment will be due soon.
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Students on track</span>
                      <span className="font-medium">
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Status Distribution */}
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getStatusIcon("green")}
                      <span className="truncate">
                        Green: {summary.summary.progressCounts.green}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getStatusIcon("yellow")}
                      <span className="truncate">
                        Yellow: {summary.summary.progressCounts.yellow}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getStatusIcon("orange")}
                      <span className="truncate">
                        Orange: {summary.summary.progressCounts.orange}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {getStatusIcon("red")}
                      <span className="truncate">
                        Red: {summary.summary.progressCounts.red}
                      </span>
                    </div>
                  </div>

                  {/* Level Distribution */}
                  {Object.keys(summary.summary.levelDistribution).length >
                    0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Level Distribution
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(summary.summary.levelDistribution).map(
                          ([level, count]) => (
                            <Badge
                              key={level}
                              variant="secondary"
                              className="text-xs"
                            >
                              L{level}: {count}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attention Alert */}
                  {summary.summary.studentsNeedingAttention > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          {summary.summary.studentsNeedingAttention} students
                          need attention
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    asChild
                    className="w-full"
                    variant={
                      summary.summary.studentsNeedingAttention > 0
                        ? "default"
                        : "outline"
                    }
                  >
                    <Link to={`/progress/cohort/${summary.cohort._id}`}>
                      {t("progress.viewDetails")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
        toast.error("Failed to load cohort progress");
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

  const getStatusIcon = (status: ProgressStatus) => {
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
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: ProgressStatus) => {
    switch (status) {
      case "green":
        return "default";
      case "yellow":
        return "secondary";
      case "orange":
        return "outline";
      case "red":
        return "destructive";
      default:
        return "outline";
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
        <p className="text-gray-500">Cohort not found</p>
        <Button onClick={() => navigate("/progress/tutor")} className="mt-4">
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

  const levelDistribution = cohortData.studentsProgress.reduce(
    (acc, student) => {
      const level = student.progress.currentLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/progress/tutor")}
          className="p-2 self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">{cohortData.cohort.name} Progress</span>
          </h1>
          <div className="space-y-1 mt-1">
            <p className="text-sm sm:text-base text-gray-600 truncate">
              {cohortData.cohort.school?.name || "School not assigned"} •{" "}
              {cohortData.studentsProgress.length} students
            </p>
            {cohortData.cohort.program && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {cohortData.cohort.program.subject} Program
                </Badge>
                <span className="text-xs sm:text-sm text-gray-500 truncate">
                  {cohortData.cohort.program.name}
                </span>
                <span className="text-xs text-gray-400">
                  ({cohortData.cohort.program.totalLevels} levels)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  On Track
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
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Need Support
                </p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {progressCounts.yellow}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Struggling
                </p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {progressCounts.orange}
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
                  Urgent
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {progressCounts.red}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress and Assessment Readiness */}
      {assessmentReadiness && cohortData.cohort.program && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Level {assessmentReadiness.currentLevel} Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
                <span className="text-gray-700 font-medium truncate">
                  {assessmentReadiness.levelTitle}
                </span>
                <Badge variant="outline" className="self-start sm:self-auto">
                  {assessmentReadiness.weeksCompleted.toFixed(1)} /{" "}
                  {assessmentReadiness.weeksRequired} weeks
                </Badge>
              </div>
              <Progress
                value={assessmentReadiness.completionPercentage}
                className="h-4"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  {assessmentReadiness.completionPercentage.toFixed(0)}%
                  Complete
                </span>
                {!assessmentReadiness.isReadyForAssessment &&
                  assessmentReadiness.daysRemaining && (
                    <span>
                      {assessmentReadiness.daysRemaining} teaching days
                      remaining
                    </span>
                  )}
              </div>
            </div>

            {assessmentReadiness.isReadyForAssessment ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  Ready for Level Assessment
                </AlertTitle>
                <AlertDescription className="text-green-700 text-sm">
                  This cohort has completed Level{" "}
                  {assessmentReadiness.currentLevel}. Conduct a level-specific
                  assessment to verify student mastery.
                  {assessmentReadiness.nextLevel && (
                    <span className="block mt-1">
                      Next:{" "}
                      <strong>{assessmentReadiness.nextLevel.title}</strong>
                    </span>
                  )}
                </AlertDescription>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Navigate to assessment page - you'll need to create this route
                      toast.info("Level assessment feature coming soon");
                    }}
                  >
                    Start Level Assessment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => {
                      // Show assessment details
                      toast.info(
                        "Assessment will test only Level " +
                          assessmentReadiness.currentLevel
                      );
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </Alert>
            ) : assessmentReadiness.completionPercentage >= 80 ? (
              <Alert className="border-orange-200 bg-orange-50">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">
                  Assessment Approaching
                </AlertTitle>
                <AlertDescription className="text-orange-700 text-sm">
                  This cohort is{" "}
                  {assessmentReadiness.completionPercentage.toFixed(0)}% through
                  Level {assessmentReadiness.currentLevel}. Assessment will be
                  due soon.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Program Timeline & Time Tracking */}
      {cohortData.timeTracking ? (
        <TimelineProgress
          timeTracking={cohortData.timeTracking}
          programName={cohortData.cohort.program?.name}
        />
      ) : cohortData.cohort.program ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-700 text-lg font-medium">
              Enhanced Time Tracking Available
            </p>
            <p className="text-yellow-600 text-sm mt-2">
              Backend implementation required for program timeline and
              assessment scheduling features.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium">
              No Program Assigned
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Assign a program to this cohort to enable time-based progress
              tracking.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(levelDistribution).map(([level, count]) => (
              <Badge key={level} variant="secondary" className="px-3 py-1">
                Level {level}: {count} students
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Progress List */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Student Progress
        </h2>
        {cohortData.studentsProgress.map((studentData) => {
          const { student, progress } = studentData;

          return (
            <Card
              key={student._id}
              className={`transition-colors ${
                progress.status === "green"
                  ? "border-green-200"
                  : progress.status === "yellow"
                  ? "border-yellow-200"
                  : progress.status === "orange"
                  ? "border-orange-200"
                  : progress.status === "red"
                  ? "border-red-200"
                  : "border-gray-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(progress.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {student.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Roll No: {student.roll_no} • Class: {student.class}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-medium">
                        Level {progress.currentLevel}
                      </p>
                      {progress.failureCount > 0 && (
                        <p className="text-xs text-gray-500">
                          {progress.failureCount} failure
                          {progress.failureCount > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={getStatusBadgeVariant(progress.status)}
                      className="text-xs"
                    >
                      {progress.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Status Description */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs sm:text-sm text-gray-600">
                  {getProgressStatusDescription(progress.status)}
                </div>

                {/* Last Update */}
                {progress.lastUpdated && (
                  <div className="mt-2 text-xs text-gray-500">
                    Last updated:{" "}
                    {new Date(progress.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
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
    <div className="space-y-6">
      {/* Main Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span>{t("progress.title")}</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {t("progress.subtitle")}
        </p>
      </div>

      {/* Overview Content */}
      <ProgressOverview />
    </div>
  );
}
