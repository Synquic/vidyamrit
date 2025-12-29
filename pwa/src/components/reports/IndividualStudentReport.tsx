"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ArrowLeft,
  Loader2,
  User,
  School,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  Phone,
  FileText,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getStudentComprehensiveReport,
  deleteStudent,
  Student,
} from "@/services/students";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface IndividualStudentReportProps {
  student: Student;
  onBack: () => void;
}

const COLORS = {
  improving: "#10b981",
  struggling: "#ef4444",
  excelling: "#3b82f6",
  average: "#f59e0b",
  needs_attention: "#ec4899",
};

const STATUS_COLORS = {
  green: "#10b981",
  yellow: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
};

export default function IndividualStudentReport({
  student,
  onBack,
}: IndividualStudentReportProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student-comprehensive-report", student._id],
    queryFn: () => getStudentComprehensiveReport(student._id),
    enabled: !!student._id,
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["archivedStudents"] });
      toast.success("Student deleted successfully");
      // Navigate back to students list or reports
      navigate("/students");
    },
    onError: (error: any) => {
      let errorMessage = "Failed to delete student";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    },
  });

  const handleDeleteStudent = () => {
    if (!student?._id) return;
    const expectedName = report?.student?.name || student?.name || "";
    if (confirmDeleteText.trim() !== expectedName.trim()) {
      toast.error("Student name does not match. Please enter the exact name.");
      return;
    }
    deleteMutation.mutate(student._id);
  };

  // Prepare level progression data for chart
  const levelProgressionData = useMemo(() => {
    if (!report) return [];

    const dataMap = new Map<string, { date: string; [subject: string]: number | string }>();

    // Combine knowledge level history and assessments
    const allAssessments = [
      ...(report.knowledgeLevelHistory || [])
        .filter((kl) => kl && kl.subject && typeof kl.subject === "string") // Filter out entries without valid subject
        .map((kl) => ({
          date: kl.date,
          subject: kl.subject.toLowerCase(),
          level: kl.level,
          type: "baseline",
        })),
      ...(report.assessments || [])
        .filter((a) => a && a.subject && typeof a.subject === "string") // Filter out entries without valid subject
        .map((a) => ({
          date: a.date,
          subject: a.subject.toLowerCase(),
          level: a.level,
          type: "regular",
        })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date and track latest level per subject
    const subjectLevels = new Map<string, number>();
    allAssessments.forEach((assessment) => {
      const dateKey = new Date(assessment.date).toISOString().split("T")[0];
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, { date: dateKey });
      }
      const entry = dataMap.get(dateKey)!;
      subjectLevels.set(assessment.subject, assessment.level);
      entry[assessment.subject] = assessment.level;
    });

    return Array.from(dataMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [report]);

  // Prepare attendance pie chart data
  const attendancePieData = useMemo(() => {
    if (!report || !report.attendance || !report.attendance.stats) return [];
    return [
      { name: "Present", value: report.attendance.stats.present || 0, color: "#10b981" },
      { name: "Absent", value: report.attendance.stats.absent || 0, color: "#ef4444" },
      { name: "Exam", value: report.attendance.stats.exam || 0, color: "#3b82f6" },
    ].filter((item) => item.value > 0);
  }, [report]);

  // Prepare attendance by month data
  const attendanceByMonthData = useMemo(() => {
    if (!report || !report.attendance || !report.attendance.byMonth) return [];
    return report.attendance.byMonth.map((month) => ({
      month: new Date(month.month + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      Present: month.present || 0,
      Absent: month.absent || 0,
      Exam: month.exam || 0,
    }));
  }, [report]);

  // Prepare subject level comparison data
  const subjectLevelData = useMemo(() => {
    if (!report || !report.currentLevels) return [];
    return Object.entries(report.currentLevels).map(([subject, level]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      level,
    }));
  }, [report]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Report</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Failed to load student report"}
              </p>
              <Button onClick={onBack}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Individual Student Report</h1>
            <p className="text-muted-foreground mt-1 md:mt-2">
              Comprehensive report for {report?.student?.name || "Student"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Student
            </Button>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Student Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Name:</span>
                    <span>{report?.student?.name || "Unknown"}</span>
                  </div>
                  {report?.student?.roll_no && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Roll No:</span>
                      <Badge variant="outline">{report.student.roll_no}</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Age:</span>
                    <span>{report?.student?.age || 0} years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Gender:</span>
                    <span className="capitalize">{report?.student?.gender || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Class:</span>
                    <span>Class {report?.student?.class || "Unknown"}</span>
                  </div>
                  {report?.student?.caste && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Category:</span>
                      <span className="uppercase">{report.student.caste}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">School & Contact</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">School:</span>
                    <span>
                      {report?.student?.school &&
                      typeof report.student.school === "object" &&
                      report.student.school !== null
                        ? (report.student.school as any)?.name || "Unknown"
                        : "Unknown"}
                    </span>
                  </div>
                  {report?.student?.mobileNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{report.student.mobileNumber}</span>
                    </div>
                  )}
                  {report?.student?.aadharNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Aadhar: {report.student.aadharNumber}</span>
                    </div>
                  )}
                  {report?.student?.apaarId && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">APAAR ID: {report.student.apaarId}</span>
                    </div>
                  )}
                  {report?.student?.contactInfo && report.student.contactInfo.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">Guardian:</span>
                      <div className="mt-1 space-y-1">
                        {report.student.contactInfo.map((contact, idx) => (
                          <div key={idx} className="text-sm">
                            {contact?.name || "Unknown"} ({contact?.relation || "Unknown"})
                            {contact?.phone_no && ` - ${contact.phone_no}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Key Metrics</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Total Assessments</span>
                    <Badge variant="default">{report?.summary?.totalAssessments || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Average Level</span>
                    <Badge variant="secondary">{report?.summary?.averageLevel || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Highest Level</span>
                    <Badge variant="default">{report?.summary?.highestLevel || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Attendance</span>
                    <Badge
                      variant={
                        (report?.summary?.attendancePercentage || 0) >= 75
                          ? "default"
                          : (report?.summary?.attendancePercentage || 0) >= 50
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {report?.summary?.attendancePercentage || 0}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="levels">Levels</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Current Levels</h3>
                    <div className="space-y-2">
                      {Object.entries(report?.currentLevels || {}).map(([subject, level]) => (
                        <div key={subject} className="flex items-center justify-between">
                          <span className="capitalize">{subject}:</span>
                          <Badge variant="default">Level {level}</Badge>
                        </div>
                      ))}
                      {Object.keys(report?.currentLevels || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground">No assessments yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Active Cohorts</h3>
                    <div className="space-y-2">
                      {(report?.cohorts || [])
                        .filter((c) => c.isActive)
                        .map((cohort) => (
                          <div key={cohort.cohortId} className="text-sm">
                            <Badge variant="outline">{cohort.cohortName}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Joined: {new Date(cohort.dateJoined).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      {(report?.cohorts || []).filter((c) => c.isActive).length === 0 && (
                        <p className="text-sm text-muted-foreground">Not in any cohort</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Last Assessment</h3>
                    <p className="text-sm">
                      {report?.student?.lastAssessmentDate
                        ? new Date(report.student.lastAssessmentDate).toLocaleDateString()
                        : "No assessments"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Level Comparison Chart */}
            {subjectLevelData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Levels by Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={subjectLevelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="level" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Levels Tab */}
          <TabsContent value="levels" className="space-y-4">
            {/* Level Progression Timeline */}
            {levelProgressionData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Level Progression Timeline</CardTitle>
                  <CardDescription>
                    Track how the student's level has progressed over time across different subjects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={levelProgressionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Legend />
                      {Object.keys(report?.currentLevels || {}).map((subject, idx) => (
                        <Line
                          key={subject}
                          type="monotone"
                          dataKey={subject}
                          stroke={COLORS[Object.keys(COLORS)[idx % Object.keys(COLORS).length] as keyof typeof COLORS]}
                          strokeWidth={2}
                          name={subject.charAt(0).toUpperCase() + subject.slice(1)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Knowledge Level Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Level Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(report?.currentLevels || {}).map(([subject, currentLevel]) => {
                    const subjectHistory = (report?.knowledgeLevelHistory || []).filter(
                      (kl) => kl && kl.subject && kl.subject.toLowerCase() === subject.toLowerCase()
                    );
                    const firstAssessment = subjectHistory[0];
                    const lastAssessment = subjectHistory[subjectHistory.length - 1];

                    return (
                      <div key={subject} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold capitalize">{subject}</h3>
                          <Badge variant="default">Level {currentLevel}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Assessments:</span>
                            <p className="font-medium">{subjectHistory.length}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">First Assessment:</span>
                            <p className="font-medium">
                              {firstAssessment
                                ? new Date(firstAssessment.date).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Assessment:</span>
                            <p className="font-medium">
                              {lastAssessment
                                ? new Date(lastAssessment.date).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Level Range:</span>
                            <p className="font-medium">
                              {subjectHistory.length > 0
                                ? `${Math.min(...subjectHistory.map((kl) => kl.level))} - ${Math.max(...subjectHistory.map((kl) => kl.level))}`
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(report.currentLevels).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No knowledge level data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment History</CardTitle>
                <CardDescription>
                  Complete history of all assessments (baseline and regular)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Mentor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ...(report?.knowledgeLevelHistory || []).map((kl) => ({
                          ...kl,
                          type: "Baseline",
                          mentor: null,
                        })),
                        ...(report?.assessments || []).map((a) => ({
                          ...a,
                          type: "Regular",
                        })),
                      ]
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() - new Date(a.date).getTime()
                        )
                        .map((assessment, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {new Date(assessment.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="capitalize">{assessment.subject}</TableCell>
                            <TableCell>
                              <Badge variant="outline">Level {assessment.level}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={assessment.type === "Baseline" ? "default" : "secondary"}
                              >
                                {assessment.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assessment.mentor &&
                              typeof assessment.mentor === "object" &&
                              assessment.mentor !== null
                                ? assessment.mentor.name || "Unknown"
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      {(report?.knowledgeLevelHistory || []).length === 0 &&
                        (report?.assessments || []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No assessments found
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            {/* Attendance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {attendancePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={attendancePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {attendancePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No attendance data available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <span>Total Days</span>
                      <Badge variant="outline">{report?.attendance?.stats?.totalDays || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <span>Present</span>
                      <Badge variant="default" className="bg-green-600">
                        {report?.attendance?.stats?.present || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                      <span>Absent</span>
                      <Badge variant="destructive">{report?.attendance?.stats?.absent || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                      <span>Exam</span>
                      <Badge variant="default" className="bg-blue-600">
                        {report?.attendance?.stats?.exam || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <span>Attendance Percentage</span>
                      <Badge
                        variant={
                          (report?.attendance?.stats?.percentage || 0) >= 75
                            ? "default"
                            : (report?.attendance?.stats?.percentage || 0) >= 50
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {report?.attendance?.stats?.percentage || 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance by Month */}
            {attendanceByMonthData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceByMonthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Present" fill="#10b981" />
                      <Bar dataKey="Absent" fill="#ef4444" />
                      <Bar dataKey="Exam" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Subject-wise Attendance */}
            {Object.keys(report.attendance.bySubject).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendance by Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(report.attendance.bySubject).map(([subject, stats]) => (
                      <div key={subject} className="border rounded-lg p-4">
                        <h3 className="font-semibold capitalize mb-3">{subject}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Present:</span>
                            <Badge variant="default" className="bg-green-600">
                              {stats.present}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Absent:</span>
                            <Badge variant="destructive">{stats.absent}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Exam:</span>
                            <Badge variant="default" className="bg-blue-600">
                              {stats.exam}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Memberships</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cohort Name</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Date Joined</TableHead>
                      <TableHead>Date Left</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(report?.cohorts || []).map((cohort) => (
                      <TableRow key={cohort.cohortId}>
                        <TableCell className="font-medium">{cohort.cohortName || "Unknown"}</TableCell>
                        <TableCell>
                          {cohort.school &&
                          typeof cohort.school === "object" &&
                          cohort.school !== null
                            ? (cohort.school as any)?.name || "Unknown"
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {cohort.tutor &&
                          typeof cohort.tutor === "object" &&
                          cohort.tutor !== null
                            ? (cohort.tutor as any)?.name || "Unknown"
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(cohort.dateJoined).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {cohort.dateLeaved
                            ? new Date(cohort.dateLeaved).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cohort.isActive ? "default" : "secondary"}>
                            {cohort.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(report?.cohorts || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No cohort memberships found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cohort Progress */}
            {report?.cohortProgress && (
              <Card>
                <CardHeader>
                  <CardTitle>Cohort Progress</CardTitle>
                  <CardDescription>
                    Current progress in {report.cohortProgress.cohortName || "Unknown Cohort"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted rounded">
                        <span className="text-sm text-muted-foreground">Current Level</span>
                        <p className="text-2xl font-bold">{report.cohortProgress.currentLevel || 0}</p>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <p className="text-2xl font-bold">
                          <Badge
                            variant="outline"
                            style={{
                              color:
                                STATUS_COLORS[
                                  (report.cohortProgress.status as keyof typeof STATUS_COLORS) || "green"
                                ],
                              borderColor:
                                STATUS_COLORS[
                                  (report.cohortProgress.status as keyof typeof STATUS_COLORS) || "green"
                                ],
                            }}
                          >
                            {report.cohortProgress.status || "Unknown"}
                          </Badge>
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <span className="text-sm text-muted-foreground">Failure Count</span>
                        <p className="text-2xl font-bold">{report.cohortProgress.failureCount || 0}</p>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <span className="text-sm text-muted-foreground">Last Assessment</span>
                        <p className="text-sm font-medium">
                          {report.cohortProgress.lastAssessmentDate
                            ? new Date(
                                report.cohortProgress.lastAssessmentDate
                              ).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    {(report.cohortProgress.assessmentHistory || []).length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Assessment History in Cohort</h3>
                        <ScrollArea className="h-[300px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Passed</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(report.cohortProgress.assessmentHistory || []).map((ah, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    {new Date(ah.date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">Level {ah.level}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {ah.passed ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      style={{
                                        color:
                                          STATUS_COLORS[ah.status as keyof typeof STATUS_COLORS],
                                        borderColor:
                                          STATUS_COLORS[ah.status as keyof typeof STATUS_COLORS],
                                      }}
                                    >
                                      {ah.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {ah.score !== null ? `${ah.score}%` : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Flags History</CardTitle>
                <CardDescription>
                  Timeline of progress flags indicating student performance trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.progressHistory.length > 0 ? (
                  <div className="space-y-4">
                    {report.progressHistory
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() - new Date(a.date).getTime()
                      )
                      .map((flag, idx) => (
                        <div
                          key={idx}
                          className="border-l-4 p-4 rounded-r-lg"
                          style={{
                            borderLeftColor:
                              COLORS[flag.flag as keyof typeof COLORS] || "#gray",
                            backgroundColor: `${COLORS[flag.flag as keyof typeof COLORS] || "#gray"}10`,
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant="outline"
                                  style={{
                                    color: COLORS[flag.flag as keyof typeof COLORS],
                                    borderColor: COLORS[flag.flag as keyof typeof COLORS],
                                  }}
                                >
                                  {flag.flag.replace("_", " ").toUpperCase()}
                                </Badge>
                                <Badge variant="secondary" className="capitalize">
                                  {flag.subject}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(flag.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm">{flag.reason}</p>
                            </div>
                            <div>
                              {flag.flag === "improving" && (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              )}
                              {flag.flag === "struggling" && (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                              )}
                              {flag.flag === "excelling" && (
                                <Award className="h-5 w-5 text-blue-600" />
                              )}
                              {flag.flag === "average" && (
                                <Minus className="h-5 w-5 text-yellow-600" />
                              )}
                              {flag.flag === "needs_attention" && (
                                <AlertCircle className="h-5 w-5 text-pink-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No progress flags recorded
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) {
              setConfirmDeleteText("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Delete Student Permanently?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action <strong>cannot be undone</strong>. This will permanently delete the student
                <strong> "{report?.student?.name || student?.name}"</strong> and all their associated data
                including assessments, attendance records, and cohort memberships.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="confirm-delete" className="text-sm font-medium">
                Type the student's full name to confirm:{" "}
                <span className="font-semibold text-destructive">
                  "{report?.student?.name || student?.name}"
                </span>
              </Label>
              <Input
                id="confirm-delete"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="Enter student's full name"
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDeleteText("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStudent}
                disabled={
                  deleteMutation.isPending ||
                  confirmDeleteText.trim() !== (report?.student?.name || student?.name || "").trim()
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

