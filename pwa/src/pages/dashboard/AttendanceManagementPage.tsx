"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { getSchools } from "@/services/schools";
import {
  getDailyAttendance,
  bulkMarkAttendance,
  type AttendanceStatus,
  type SessionType,
  type BulkAttendanceRecord,
} from "@/services/attendance";

export default function AttendanceManagementPage() {
  const queryClient = useQueryClient();

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedSubject, setSelectedSubject] = useState<
    "hindi" | "math" | "english" | "all"
  >("all");
  const [sessionType, setSessionType] = useState<SessionType>("regular");
  const [attendanceData, setAttendanceData] = useState<
    Map<string, AttendanceStatus>
  >(new Map());
  const [notesData, setNotesData] = useState<Map<string, string>>(new Map());

  // Fetch schools
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Fetch daily attendance
  const {
    data: dailyAttendance = [],
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: [
      "dailyAttendance",
      selectedSchool,
      selectedDate,
      selectedSubject,
    ],
    queryFn: () =>
      getDailyAttendance(
        selectedSchool,
        selectedDate,
        selectedSubject === "all" ? undefined : selectedSubject
      ),
    enabled: !!selectedSchool && !!selectedDate,
  });

  // Bulk mark attendance mutation
  const bulkMarkAttendanceMutation = useMutation({
    mutationFn: bulkMarkAttendance,
    onSuccess: (data) => {
      toast.success(`Attendance marked for ${data.success} students`);
      if (data.errorCount > 0) {
        toast.warning(`${data.errorCount} errors occurred`);
      }
      queryClient.invalidateQueries({ queryKey: ["dailyAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceStats"] });
    },
    onError: (error) => {
      toast.error("Failed to mark attendance");
      console.error(error);
    },
  });

  // Update attendance data when daily attendance loads
  useEffect(() => {
    if (dailyAttendance.length > 0) {
      const newAttendanceData = new Map();
      const newNotesData = new Map();

      dailyAttendance.forEach((record) => {
        if (record.attendance) {
          newAttendanceData.set(record.student._id, record.attendance.status);
          if (record.attendance.notes) {
            newNotesData.set(record.student._id, record.attendance.notes);
          }
        }
      });

      setAttendanceData(newAttendanceData);
      setNotesData(newNotesData);
    }
  }, [dailyAttendance]);

  const handleAttendanceChange = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAttendanceData((prev) => new Map(prev.set(studentId, status)));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setNotesData((prev) => new Map(prev.set(studentId, notes)));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchool) {
      toast.error("Please select a school");
      return;
    }

    const attendanceRecords: BulkAttendanceRecord[] = [];

    dailyAttendance.forEach((record) => {
      const status = attendanceData.get(record.student._id);
      if (status) {
        attendanceRecords.push({
          studentId: record.student._id,
          status,
          subject: selectedSubject === "all" ? undefined : selectedSubject,
          sessionType,
          notes: notesData.get(record.student._id) || "",
        });
      }
    });

    if (attendanceRecords.length === 0) {
      toast.error("Please mark attendance for at least one student");
      return;
    }

    bulkMarkAttendanceMutation.mutate({
      attendanceRecords,
      schoolId: selectedSchool,
      date: selectedDate,
    });
  };

  const getStatusBadge = (status: AttendanceStatus | null) => {
    if (!status) return <Badge variant="outline">Not Marked</Badge>;

    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case "exam":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Exam
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAttendanceStats = () => {
    const present = Array.from(attendanceData.values()).filter(
      (status) => status === "present"
    ).length;
    const absent = Array.from(attendanceData.values()).filter(
      (status) => status === "absent"
    ).length;
    const exam = Array.from(attendanceData.values()).filter(
      (status) => status === "exam"
    ).length;
    const total = dailyAttendance.length;
    const marked = present + absent + exam;

    return {
      present,
      absent,
      exam,
      total,
      marked,
      percentage: total > 0 ? ((present / total) * 100).toFixed(1) : "0",
    };
  };

  const stats = getAttendanceStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Daily Attendance Management
        </h1>
        <p className="text-muted-foreground">
          Mark and track student attendance for daily sessions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Session Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="school">School</Label>
            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school._id} value={school._id || ""}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Select
              value={selectedSubject}
              onValueChange={(value) =>
                setSelectedSubject(
                  value as "hindi" | "math" | "english" | "all"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="math">Math</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sessionType">Session Type</Label>
            <Select
              value={sessionType}
              onValueChange={(value) => setSessionType(value as SessionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Class</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="review">Review Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => refetchAttendance()}
              variant="outline"
              className="w-full"
            >
              Load Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.present}
            </div>
            <div className="text-sm text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.absent}
            </div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.exam}</div>
            <div className="text-sm text-muted-foreground">Exam</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stats.marked}/{stats.total}
            </div>
            <div className="text-sm text-muted-foreground">Marked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.percentage}%
            </div>
            <div className="text-sm text-muted-foreground">Attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      {selectedSchool && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Attendance
              </CardTitle>
              <CardDescription>
                Mark attendance for{" "}
                {format(new Date(selectedDate), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <Button
              onClick={handleSaveAttendance}
              disabled={
                bulkMarkAttendanceMutation.isPending || stats.marked === 0
              }
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Attendance
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAttendance ? (
              <div className="text-center py-8">Loading students...</div>
            ) : dailyAttendance.length === 0 ? (
              <div className="text-center py-8">
                No students found for selected school
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyAttendance.map((record) => (
                    <TableRow key={record.student._id}>
                      <TableCell className="font-medium">
                        {record.student.name}
                      </TableCell>
                      <TableCell>{record.student.roll_no}</TableCell>
                      <TableCell>{record.student.class}</TableCell>
                      <TableCell>
                        {getStatusBadge(
                          attendanceData.get(record.student._id) || null
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              attendanceData.get(record.student._id) ===
                              "present"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleAttendanceChange(
                                record.student._id,
                                "present"
                              )
                            }
                            className="h-8"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />P
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              attendanceData.get(record.student._id) ===
                              "absent"
                                ? "destructive"
                                : "outline"
                            }
                            onClick={() =>
                              handleAttendanceChange(
                                record.student._id,
                                "absent"
                              )
                            }
                            className="h-8"
                          >
                            <XCircle className="w-3 h-3 mr-1" />A
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              attendanceData.get(record.student._id) === "exam"
                                ? "secondary"
                                : "outline"
                            }
                            onClick={() =>
                              handleAttendanceChange(record.student._id, "exam")
                            }
                            className="h-8"
                          >
                            <Clock className="w-3 h-3 mr-1" />E
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Notes..."
                          value={notesData.get(record.student._id) || ""}
                          onChange={(e) =>
                            handleNotesChange(
                              record.student._id,
                              e.target.value
                            )
                          }
                          className="h-8"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
