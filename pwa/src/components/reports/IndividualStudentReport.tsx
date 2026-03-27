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
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Award,
  FileText,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { getStudentTestReports, type TestReport } from "@/services/testReports";
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

  // Fetch test reports from TestReport model
  const { data: testReports = [] } = useQuery({
    queryKey: ["student-test-reports", student._id],
    queryFn: () => getStudentTestReports(student._id),
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack} size="lg" className="h-11 px-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-base">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/test-report/student/${student._id}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Test Report
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="hidden sm:flex"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Student
              </Button>
            </div>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="sm:hidden h-11 w-11"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {report?.student?.name || "Student"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Comprehensive report
            </p>
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
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-muted-foreground">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">Name:</span>
                    <span className="text-base">{report?.student?.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">Age:</span>
                    <span className="text-base">{report?.student?.age || 0} years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">Gender:</span>
                    <span className="text-base capitalize">{report?.student?.gender || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base font-medium">Class:</span>
                    <span className="text-base">Class {report?.student?.class || "Unknown"}</span>
                  </div>
                  {report?.student?.caste && (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium">Category:</span>
                      <span className="text-base uppercase">{report.student.caste}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 min-w-[250px]">
                <h3 className="font-semibold text-base text-muted-foreground">Key Metrics</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-base">Total Tests</span>
                    <Badge variant="default" className="text-sm px-3 py-1">{report?.summary?.totalAssessments || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-base">Highest Level</span>
                    <Badge variant="default" className="text-sm px-3 py-1">{report?.summary?.highestLevel || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-base">Attendance</span>
                    <Badge
                      className="text-sm px-3 py-1"
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
          <TabsList className="flex w-full overflow-x-auto no-scrollbar sm:grid sm:grid-cols-5 h-auto p-1">
            <TabsTrigger value="overview" className="min-w-fit px-4 py-2.5 text-sm sm:text-base">Overview</TabsTrigger>
            <TabsTrigger value="levels" className="min-w-fit px-4 py-2.5 text-sm sm:text-base">Levels</TabsTrigger>
            <TabsTrigger value="assessments" className="min-w-fit px-4 py-2.5 text-sm sm:text-base">Tests</TabsTrigger>
            <TabsTrigger value="attendance" className="min-w-fit px-4 py-2.5 text-sm sm:text-base">Attendance</TabsTrigger>
            <TabsTrigger value="progress" className="min-w-fit px-4 py-2.5 text-sm sm:text-base">Progress</TabsTrigger>
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
                        <p className="text-sm text-muted-foreground">No tests yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Active Groups</h3>
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
                        <p className="text-sm text-muted-foreground">Not in any group</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Last Test</h3>
                    <p className="text-sm">
                      {report?.student?.lastAssessmentDate
                        ? new Date(report.student.lastAssessmentDate).toLocaleDateString()
                        : "No tests"}
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
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectLevelData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="level" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
                  <div className="h-[250px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
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
                  </div>
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
                            <span className="text-muted-foreground">Total Tests:</span>
                            <p className="font-medium">{subjectHistory.length}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">First Test:</span>
                            <p className="font-medium">
                              {firstAssessment
                                ? new Date(firstAssessment.date).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Test:</span>
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

          {/* Tests Tab */}
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test History</CardTitle>
                <CardDescription>
                  Complete history of all tests (baseline and level tests)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Priority 1: TestReport model data (new tests with score/result)
                  const testReportEntries = (testReports || []).map((tr: TestReport) => ({
                    date: tr.date,
                    subject: tr.subject,
                    level: tr.level,
                    type: tr.testType === "baseline" ? "Baseline" as const : "Level Test" as const,
                    score: tr.score,
                    passed: tr.passed,
                    action: tr.action,
                    totalQuestions: tr.totalQuestions,
                    correctAnswers: tr.correctAnswers,
                    mentor: tr.mentor,
                    source: "testReport" as const,
                  }));

                  // Fallback: only use old data if NO TestReport entries exist
                  const fallbackEntries = testReportEntries.length === 0 ? [
                    ...(report?.knowledgeLevelHistory || []).map((kl) => ({
                      date: kl.date,
                      subject: kl.subject,
                      level: kl.level,
                      type: "Baseline" as const,
                      score: null as number | null,
                      passed: null as boolean | null,
                      action: null as string | null,
                      totalQuestions: null as number | null,
                      correctAnswers: null as number | null,
                      mentor: null as any,
                      source: "fallback" as const,
                    })),
                    ...(report?.assessments || []).map((a) => ({
                      date: a.date,
                      subject: a.subject,
                      level: a.level,
                      type: "Level Test" as const,
                      score: null as number | null,
                      passed: null as boolean | null,
                      action: null as string | null,
                      totalQuestions: null as number | null,
                      correctAnswers: null as number | null,
                      mentor: a.mentor,
                      source: "fallback" as const,
                    })),
                  ] : [];

                  const allTests = [...testReportEntries, ...fallbackEntries].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  );

                  if (allTests.length === 0) {
                    return (
                      <p className="text-center text-muted-foreground py-8 text-base">
                        No tests found
                      </p>
                    );
                  }

                  return (
                    <>
                      {/* Mobile: Card layout */}
                      <div className="sm:hidden space-y-3 max-h-[500px] overflow-y-auto">
                        {allTests.map((test, idx) => (
                          <div key={idx} className={`border rounded-lg p-4 space-y-2 ${
                            test.passed === true ? "border-green-200 bg-green-50/50" :
                            test.passed === false ? "border-red-200 bg-red-50/50" : ""
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-base font-medium capitalize">{test.subject}</span>
                              <Badge variant="outline" className="text-sm">Level {test.level}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {new Date(test.date).toLocaleDateString()}
                              </span>
                              <Badge
                                variant={test.type === "Baseline" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {test.type}
                              </Badge>
                            </div>
                            {test.score !== null && (
                              <div className="flex items-center gap-3">
                                <span className="text-sm">
                                  Questions: {test.correctAnswers}/{test.totalQuestions}
                                </span>
                                <span className={`text-sm font-semibold ${test.score >= 80 ? "text-green-600" : "text-red-600"}`}>
                                  {test.score.toFixed(1)}%
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              {test.passed !== null && (
                                <Badge className={`text-xs ${test.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {test.passed ? "Pass" : "Fail"}
                                </Badge>
                              )}
                              {test.action && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {test.action}
                                </Badge>
                              )}
                            </div>
                            {test.mentor &&
                              typeof test.mentor === "object" &&
                              test.mentor !== null && (
                                <p className="text-sm text-muted-foreground">
                                  Mentor: {test.mentor.name || "Unknown"}
                                </p>
                              )}
                          </div>
                        ))}
                      </div>

                      {/* Desktop: Table layout */}
                      <ScrollArea className="h-[600px] hidden sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Questions</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Mentor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allTests.map((test, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  {new Date(test.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="capitalize">{test.subject}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">Level {test.level}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={test.type === "Baseline" ? "default" : "secondary"}
                                  >
                                    {test.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {test.totalQuestions !== null
                                    ? `${test.correctAnswers}/${test.totalQuestions}`
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {test.score !== null ? (
                                    <span className={`font-semibold ${test.score >= 80 ? "text-green-600" : "text-red-600"}`}>
                                      {test.score.toFixed(1)}%
                                    </span>
                                  ) : "-"}
                                </TableCell>
                                <TableCell>
                                  {test.passed !== null ? (
                                    <Badge className={`text-xs ${test.passed ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}`}>
                                      {test.passed ? "Pass" : "Fail"}
                                    </Badge>
                                  ) : "-"}
                                </TableCell>
                                <TableCell>
                                  {test.action ? (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {test.action}
                                    </Badge>
                                  ) : "-"}
                                </TableCell>
                                <TableCell>
                                  {test.mentor &&
                                  typeof test.mentor === "object" &&
                                  test.mentor !== null
                                    ? test.mentor.name || "Unknown"
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            {/* Attendance Statistics */}
            <div className="max-w-md">
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
                including tests, attendance records, and group memberships.
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

