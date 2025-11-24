import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Users, Calendar, CheckCircle, XCircle, Save, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getCohortAttendance, 
  recordCohortAttendance, 
  CohortAttendanceData,
  AttendanceStatus,
  CohortAttendanceRecord 
} from '@/services/attendance';
import { toast } from 'sonner';

export default function CohortAttendance() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();
  
  const [cohortData, setCohortData] = useState<CohortAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{[studentId: string]: AttendanceStatus}>({});

  useEffect(() => {
    if (cohortId) {
      fetchCohortAttendance();
    }
  }, [cohortId, selectedDate]);

  const fetchCohortAttendance = async () => {
    try {
      setLoading(true);
      const data = await getCohortAttendance(cohortId!, { date: selectedDate });
      setCohortData(data);
      
      // Initialize attendance records with existing data for the selected date
      const existingAttendance = data.attendance[selectedDate] || [];
      const records: {[studentId: string]: AttendanceStatus} = {};
      
      existingAttendance.forEach(record => {
        records[record.student._id] = record.status;
      });
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching cohort attendance:', error);
      toast.error('Failed to load cohort attendance');
    } finally {
      setLoading(false);
    }
  };

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

  const saveAttendance = async () => {
    if (!cohortData || !cohortId) return;

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
      
      // Refresh data
      await fetchCohortAttendance();
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
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/attendance')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            {cohortData.cohort.name}
          </h1>
          <p className="text-gray-600">
            {cohortData.cohort.school?.name || 'School not assigned'} • {totalStudents} students
          </p>
        </div>
      </div>

      {/* Date and Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                <CheckCircle className="h-4 w-4 mr-2" />
                All Present
              </Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent}>
                <XCircle className="h-4 w-4 mr-2" />
                All Absent
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{totalStudents - totalMarked}</div>
              <div className="text-sm text-gray-600">Unmarked</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="space-y-3">
        {cohortData.cohort.students.map((student) => {
          const currentStatus = attendanceRecords[student._id];
          
          return (
            <Card key={student._id} className={`transition-colors ${
              currentStatus === 'present' ? 'border-green-200 bg-green-50' :
              currentStatus === 'absent' ? 'border-red-200 bg-red-50' :
              'border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">
                        Roll No: {student.roll_no} • Class: {student.class}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={currentStatus === 'present' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student._id, 'present')}
                      className={currentStatus === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student._id, 'absent')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Absent
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {totalMarked} of {totalStudents} students marked
              </div>
              <Button 
                onClick={saveAttendance} 
                disabled={saving || totalMarked === 0}
                className="px-8"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Attendance
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