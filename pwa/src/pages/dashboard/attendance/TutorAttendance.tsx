import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getTutorAttendanceSummary, TutorAttendanceSummary } from '@/services/attendance';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { useSchoolContext } from '@/contexts/SchoolContext';

export default function TutorAttendance() {
  const { t } = useTranslation();
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const [attendanceSummary, setAttendanceSummary] = useState<TutorAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendanceSummary();
  }, [selectedDate, selectedSchool, isSchoolContextActive]);

  const fetchAttendanceSummary = async () => {
    try {
      setLoading(true);
      // Pass schoolId only if school context is active and a school is selected
      const schoolId = isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;
      const data = await getTutorAttendanceSummary(selectedDate, schoolId);
      
      // Debug logging to see the actual structure
      console.log('Raw attendance summary data:', data);
      
      // Filter out any summaries with invalid cohort data
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
      
      console.log('Valid summaries after filtering:', validSummaries);
      
      setAttendanceSummary(validSummaries);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      toast.error('Failed to load attendance summary');
      setAttendanceSummary([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            {t('attendance.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('attendance.subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{summary.cohort.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {summary.attendance.totalStudents} students
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {summary.cohort.school?.name || 'School not assigned'}
                </p>
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