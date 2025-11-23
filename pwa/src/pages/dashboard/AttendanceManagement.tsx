import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, BookOpen, 
  ArrowLeft, Save, RotateCcw, PartyPopper
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getTutorAttendanceSummary, 
  getCohortAttendance,
  recordCohortAttendance,
  AttendanceStatus,
  CohortAttendanceRecord
} from '@/services/attendance';
import { toggleCohortHoliday } from '@/services/cohorts';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { useSchoolContext } from '@/contexts/SchoolContext';

// Overview Component (TutorAttendance functionality)
function AttendanceOverview() {
  const { t } = useTranslation();
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const schoolId = isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;

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

                {/* Action Button */}
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
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
              <Button 
                variant={isHoliday ? "default" : "outline"} 
                size="sm" 
                onClick={handleMarkHoliday}
                disabled={markingHoliday}
                className={`flex-1 sm:flex-none ${isHoliday ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}
              >
                <PartyPopper className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{isHoliday ? "Unmark Holiday" : "Mark Holiday"}</span>
                <span className="sm:hidden">{isHoliday ? "Unmark" : "Holiday"}</span>
              </Button>
            </div>
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

