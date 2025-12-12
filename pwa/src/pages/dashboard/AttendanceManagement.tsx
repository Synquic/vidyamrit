import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, BookOpen, 
  ArrowLeft, Save, RotateCcw, PartyPopper, TrendingUp, AlertCircle,
  ChevronRight, AlertTriangle, Play
} from 'lucide-react';
import { getTutorProgressSummary, getCohortProgress } from '@/services/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { 
  getTutorAttendanceSummary, 
  getCohortAttendance,
  recordCohortAttendance,
  AttendanceStatus,
  CohortAttendanceRecord
} from '@/services/attendance';
import { toggleCohortHoliday, getCohorts, startCohort } from '@/services/cohorts';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { useSchoolContext } from '@/contexts/SchoolContext';

// Overview Component (TutorAttendance functionality)
function AttendanceOverview() {
  const { t } = useTranslation();
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [startingCohort, setStartingCohort] = useState<any>(null);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const queryClient = useQueryClient();

  const schoolId = isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;

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

  const { data: attendanceSummary = [], isLoading: loading } = useQuery({
    queryKey: ["tutor-attendance-summary", selectedDate, schoolId],
    queryFn: async () => {
      const data = await getTutorAttendanceSummary(selectedDate, schoolId);
      
      const validSummaries = data.filter(summary => {
        const isValid = summary && 
          summary.cohort && 
          summary.cohort._id && 
          summary.attendance;
        
        if (!isValid) {
          console.warn('Invalid summary filtered out:', summary);
        }
        
        return isValid;
      });
      
      return validSummaries;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch cohorts to check start status
  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts-for-attendance", schoolId],
    queryFn: () => getCohorts(schoolId),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      toast.success("Cohort started successfully");
    },
    onError: (error: any) => {
      let errorMessage = "Failed to start cohort";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    },
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

  // Get cohort start date
  const getCohortStartDate = (cohortId: string): string | null => {
    const cohort = cohorts.find(c => c._id === cohortId);
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
    setCustomStartDate(new Date().toISOString().split('T')[0]);
    setIsStartDialogOpen(true);
  };

  // Handle confirm start cohort
  const handleConfirmStartCohort = () => {
    if (!startingCohort?._id) return;
    
    const startDateToUse = customStartDate || new Date().toISOString().split('T')[0];
    startCohortMutation.mutate({
      id: startingCohort._id,
      startDate: startDateToUse,
    });
  };

  const getAttendanceRateBadgeVariant = (rate: number) => {
    if (rate >= 90) return 'default';
    if (rate >= 75) return 'secondary';
    return 'destructive';
  };

  if (loading) {
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cohort Overview
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            View and manage attendance across all cohorts
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const selected = new Date(e.target.value);
                const dayOfWeek = selected.getDay();
                
                // Prevent Sunday selection (day 0)
                if (dayOfWeek === 0) {
                  toast.error('Sunday is a holiday. Please select a teaching day (Monday-Saturday).');
                  // Auto-select next Monday
                  const nextMonday = new Date(selected);
                  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
                  nextMonday.setDate(selected.getDate() + daysUntilMonday);
                  setSelectedDate(nextMonday.toISOString().split('T')[0]);
                  return;
                }
                
                setSelectedDate(e.target.value);
              }}
              onFocus={(e) => {
                // Set min date to prevent selecting past Sundays
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                e.currentTarget.min = today.toISOString().split('T')[0];
              }}
              className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">(Mon-Sat only)</span>
        </div>
      </div>

      {/* Upcoming Assessments */}
      {upcomingAssessments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Upcoming Assessments (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingAssessments.map((summary: any, idx) => {
                const assessmentDate = new Date(summary.nextAssessmentDue || 0);
                const daysUntil = Math.ceil(
                  (assessmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {summary.cohort?.name || "Unknown Cohort"}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {summary.program?.name || summary.program?.subject || "Program"} - Level {summary.currentLevel || "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={daysUntil <= 1 ? "destructive" : daysUntil <= 3 ? "secondary" : "outline"}>
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
            <p className="text-gray-500 text-lg">
              {t('attendance.noCohorts')}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {t('attendance.noCohortsDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {attendanceSummary
            .filter(summary => summary && summary.cohort && summary.attendance)
            .map((summary) => (
            <Card key={summary.cohort._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-600 font-medium">
                      {summary.cohort.school?.name || 'School not assigned'}
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
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Not Started
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Started: {formatDate(getCohortStartDate(summary.cohort._id))}</span>
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
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getAttendanceRateBadgeVariant(summary.attendance.attendanceRate)}
                      className="text-xs"
                    >
                      {summary.attendance.attendanceRate.toFixed(1)}%
                    </Badge>
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
                      Start Cohort
                    </Button>
                  ) : (
                    <Button 
                      asChild 
                      className="w-full"
                      variant={summary.attendance.unmarkedCount > 0 ? "default" : "outline"}
                    >
                      <Link to={`/attendance/cohort/${summary.cohort._id}`}>
                        {summary.attendance.unmarkedCount > 0 
                          ? t('attendance.markAttendance')
                          : t('attendance.viewAttendance')
                        }
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
              {t('attendance.todaySummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceSummary.length}
                </div>
                <div className="text-sm text-gray-600">
                  {t('attendance.totalCohorts')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {attendanceSummary.reduce((sum, s) => sum + s.attendance.totalStudents, 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t('attendance.totalStudents')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {attendanceSummary.reduce((sum, s) => sum + s.attendance.presentCount, 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t('attendance.totalPresent')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {attendanceSummary.reduce((sum, s) => sum + s.attendance.unmarkedCount, 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t('attendance.totalUnmarked')}
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
                Upcoming Assessments
              </CardTitle>
            </div>
            <p className="text-sm text-blue-700">
              Cohorts with assessments due in the next 7 days
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssessments.map((summary) => {
                const assessmentDate = summary.timeTracking?.nextAssessmentDue
                  ? new Date(summary.timeTracking.nextAssessmentDue)
                  : null;
                const daysUntil = summary.timeTracking?.daysUntilNextAssessment || 0;
                
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
                        {summary.cohort.program?.subject || "N/A"} • Level {summary.cohort.currentLevel || "N/A"}
                      </div>
                      {assessmentDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {assessmentDate.toLocaleDateString("en-IN", {
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
                          {daysUntil === 0 ? "Today" : `${daysUntil} day${daysUntil > 1 ? "s" : ""}`}
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

      {/* Start Cohort Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Cohort</DialogTitle>
            <DialogDescription>
              Set a start date for "{startingCohort?.name}". The cohort will begin tracking progress and attendance from this date.
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
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Select a date to start the cohort. Leave as today's date to start immediately.
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Once started, the cohort will begin tracking:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Progress tracking from the start date</li>
                  <li>Attendance recording</li>
                  <li>Assessment timelines</li>
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
                  Start Cohort
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
  const [markingHoliday, setMarkingHoliday] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{[studentId: string]: AttendanceStatus}>({});
  const [isHoliday, setIsHoliday] = useState(false);
  const queryClient = useQueryClient();

  // Fetch cohort progress for indicator
  const { data: progressData } = useQuery({
    queryKey: ["cohort-progress-indicator", cohortId],
    queryFn: async () => {
      try {
        const data = await getCohortProgress(cohortId!);
        return data;
      } catch (error) {
        console.error('Error fetching cohort progress:', error);
        return null;
      }
    },
    enabled: !!cohortId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate days until assessment
  const daysUntilAssessment = useMemo(() => {
    if (!progressData?.timeTracking) return null;
    return progressData.timeTracking.daysUntilNextAssessment;
  }, [progressData]);

  // Get inline style for smooth gradient color based on days
  const getGradientStyle = (days: number | null) => {
    if (days === null) return {};
    
    // Clamp days between -7 and 21 for color calculation
    const clampedDays = Math.max(-7, Math.min(21, days));
    
    // Calculate hue: red (0) -> orange (30) -> yellow (60) -> green (120)
    // -7 days = 0 (red), 0 days = 15 (red-orange), 7 days = 45 (orange), 14 days = 90 (yellow-green), 21+ days = 120 (green)
    let hue: number;
    if (clampedDays < 0) {
      // Overdue: deeper red
      hue = 0;
    } else if (clampedDays <= 7) {
      // 0-7 days: red to orange (0 to 30)
      hue = (clampedDays / 7) * 30;
    } else if (clampedDays <= 14) {
      // 7-14 days: orange to yellow-green (30 to 80)
      hue = 30 + ((clampedDays - 7) / 7) * 50;
    } else {
      // 14+ days: yellow-green to green (80 to 120)
      hue = 80 + ((clampedDays - 14) / 7) * 40;
    }
    
    return {
      backgroundColor: `hsl(${hue}, 85%, 95%)`,
      borderColor: `hsl(${hue}, 70%, 70%)`,
      color: `hsl(${hue}, 80%, 35%)`,
    };
  };

  // Get assessment message based on days
  const getAssessmentMessage = (days: number | null): string => {
    if (days === null) return "No data";
    
    if (days < 0) {
      // Overdue
      const overdueDays = Math.abs(days);
      if (overdueDays === 1) {
        return "Assessment pending (1 day overdue)";
      }
      return `Assessment pending (${overdueDays} days overdue)`;
    } else if (days === 0) {
      return "Assessment today";
    } else if (days === 1) {
      return "Assessment in 1 day";
    } else {
      return `Assessment in ${days} days`;
    }
  };

  // Handle progress indicator click
  const handleProgressClick = () => {
    navigate(`/progress/cohort/${cohortId}`);
  };

  const { data: cohortData, isLoading: loading } = useQuery({
    queryKey: ["cohort-attendance", cohortId, selectedDate],
    queryFn: async () => {
      try {
        const data = await getCohortAttendance(cohortId!, { date: selectedDate });
        
        // Initialize attendance records with existing data
        const existingAttendance = data.attendance[selectedDate] || [];
        const records: {[studentId: string]: AttendanceStatus} = {};
        
        existingAttendance.forEach(record => {
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
        console.error('Error fetching cohort attendance:', error);
        toast.error('Failed to load cohort attendance');
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
      const records: {[studentId: string]: AttendanceStatus} = {};
      
      existingAttendance.forEach(record => {
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

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    if (!cohortData) return;
    const records: {[studentId: string]: AttendanceStatus} = {};
    cohortData.cohort.students.forEach(student => {
      records[student._id] = 'present';
    });
    setAttendanceRecords(records);
  };

  const markAllAbsent = () => {
    if (!cohortData) return;
    const records: {[studentId: string]: AttendanceStatus} = {};
    cohortData.cohort.students.forEach(student => {
      records[student._id] = 'absent';
    });
    setAttendanceRecords(records);
  };

  const clearAll = () => {
    setAttendanceRecords({});
  };

  const handleMarkHoliday = async () => {
    if (!cohortId) return;

    try {
      setMarkingHoliday(true);
      const result = await toggleCohortHoliday(cohortId, selectedDate);
      
      setIsHoliday(result.isHoliday);
      toast.success(result.message);
      
      // Clear attendance records if marking as holiday
      if (result.isHoliday) {
        setAttendanceRecords({});
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["cohort-attendance", cohortId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["tutor-attendance-summary"] });
    } catch (error: any) {
      console.error('Error toggling holiday:', error);
      toast.error(error.response?.data?.error || 'Failed to mark holiday');
    } finally {
      setMarkingHoliday(false);
    }
  };

  const saveAttendance = async () => {
    if (!cohortData || !cohortId) return;

    // Prevent saving if it's a holiday
    if (isHoliday) {
      toast.error('Cannot save attendance on a holiday. Please unmark the holiday first.');
      return;
    }

    try {
      setSaving(true);
      
      const attendanceData: CohortAttendanceRecord[] = Object.entries(attendanceRecords).map(
        ([studentId, status]) => ({
          studentId,
          status
        })
      );

      if (attendanceData.length === 0) {
        toast.error('Please mark attendance for at least one student');
        return;
      }

      await recordCohortAttendance({
        cohortId,
        attendanceRecords: attendanceData,
        date: selectedDate
      });

      toast.success(`Attendance saved successfully for ${attendanceData.length} students`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["cohort-attendance", cohortId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["tutor-attendance-summary"] });
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
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
        <p className="text-gray-500">Cohort not found</p>
        <Button onClick={() => navigate('/attendance')} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const presentCount = Object.values(attendanceRecords).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter(status => status === 'absent').length;
  const totalMarked = Object.keys(attendanceRecords).length;
  const totalStudents = cohortData.cohort.students.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/attendance')}
          className="p-2 self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="truncate">{cohortData.cohort.name}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 truncate">
            {cohortData.cohort.school?.name || 'School not assigned'} • {totalStudents} students
          </p>
        </div>
      </div>

      {/* Date and Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-3">
            {/* Row 1: Date Picker and Progress Indicator */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const selected = new Date(e.target.value);
                    const dayOfWeek = selected.getDay();
                    
                    // Prevent Sunday selection (day 0)
                    if (dayOfWeek === 0) {
                      toast.error('Sunday is a holiday. Please select a teaching day (Monday-Saturday).');
                      // Auto-select next Monday
                      const nextMonday = new Date(selected);
                      const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
                      nextMonday.setDate(selected.getDate() + daysUntilMonday);
                      setSelectedDate(nextMonday.toISOString().split('T')[0]);
                      return;
                    }
                    
                    setSelectedDate(e.target.value);
                  }}
                  onFocus={(e) => {
                    // Set min date to prevent selecting past Sundays
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    e.currentTarget.min = today.toISOString().split('T')[0];
                  }}
                  className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="text-xs text-gray-500 hidden sm:inline">(Mon-Sat only)</span>
              </div>

              {/* Progress Indicator - Days until assessment with gradient color */}
              <button
                onClick={handleProgressClick}
                style={getGradientStyle(daysUntilAssessment)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md hover:scale-105 active:scale-100"
              >
                {daysUntilAssessment !== null && daysUntilAssessment < 0 && (
                  <AlertTriangle className="h-4 w-4 animate-pulse" />
                )}
                <TrendingUp className="h-4 w-4" />
                <div className="flex items-center gap-1 text-sm font-semibold">
                  {getAssessmentMessage(daysUntilAssessment)}
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>
            </div>

            {/* Row 2: Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllPresent}
                disabled={isHoliday}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">All Present</span>
                <span className="sm:hidden">All P</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAbsent}
                disabled={isHoliday}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">All Absent</span>
                <span className="sm:hidden">All A</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
                disabled={isHoliday}
                className="flex-1 sm:flex-none"
              >
                <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
                Clear
              </Button>
            </div>

            {/* Row 3: Holiday Button (full width) */}
            <Button 
              variant={isHoliday ? "default" : "outline"} 
              size="sm" 
              onClick={handleMarkHoliday}
              disabled={markingHoliday}
              className={`w-full ${isHoliday ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
            >
              <PartyPopper className="h-4 w-4 mr-2" />
              {isHoliday ? "Unmark Holiday" : "Mark Holiday"}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isHoliday && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center gap-2 text-purple-700">
                <PartyPopper className="h-4 w-4" />
                <span className="font-medium">This date is marked as a holiday. No teaching will occur on this day.</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div>
              <div className="text-base sm:text-lg font-bold text-green-600">{presentCount}</div>
              <div className="text-xs sm:text-sm text-gray-600">Present</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-red-600">{absentCount}</div>
              <div className="text-xs sm:text-sm text-gray-600">Absent</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-orange-600">{totalStudents - totalMarked}</div>
              <div className="text-xs sm:text-sm text-gray-600">Unmarked</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-blue-600">
                {totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="space-y-3">
        {isHoliday ? (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-8 text-center">
              <PartyPopper className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-700 mb-2">Holiday - No Teaching</h3>
              <p className="text-purple-600">
                This date is marked as a holiday. Attendance cannot be marked on holidays.
              </p>
            </CardContent>
          </Card>
        ) : (
          cohortData.cohort.students.map((student) => {
            const currentStatus = attendanceRecords[student._id];
            
            return (
              <Card key={student._id} className={`transition-colors ${
                currentStatus === 'present' ? 'border-green-200 bg-green-50' :
                currentStatus === 'absent' ? 'border-red-200 bg-red-50' :
                'border-gray-200'
              }`}>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        Roll No: {student.roll_no} • Class: {student.class}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant={currentStatus === 'present' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student._id, 'present')}
                      className={`flex-1 sm:flex-none ${currentStatus === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student._id, 'absent')}
                      className="flex-1 sm:flex-none"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Absent
                    </Button>
                  </div>
                </div>
                </CardContent>
              </Card>
            );
          })
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
                disabled={saving || totalMarked === 0 || isHoliday}
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

// Main Attendance Management Component
export default function AttendanceManagement() {
  const { cohortId } = useParams<{ cohortId?: string }>();
  const { t } = useTranslation();

  // If cohortId is present, show detail view; otherwise show overview
  if (cohortId) {
    return <CohortAttendanceDetail />;
  }

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          {t('attendance.title')}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('attendance.subtitle')}
        </p>
      </div>

      {/* Overview Content */}
      <AttendanceOverview />
    </div>
  );
}

