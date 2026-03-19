import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getStudent } from "@/services/students";
import { getStudentTestReports } from "@/services/testReports";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  GraduationCap,
  School,
  User,
} from "lucide-react";

export default function TestReportPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const {
    data: student,
    isLoading: studentLoading,
  } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudent(studentId!),
    enabled: !!studentId,
  });

  const {
    data: reports,
    isLoading: reportsLoading,
    error,
  } = useQuery({
    queryKey: ["test-reports", studentId],
    queryFn: () => getStudentTestReports(studentId!),
    enabled: !!studentId,
  });

  const isLoading = studentLoading || reportsLoading;

  const subjects = useMemo(() => {
    if (!reports) return [];
    const unique = new Set(reports.map((r) => r.subject));
    return Array.from(unique).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    return reports.filter((r) => {
      if (subjectFilter !== "all" && r.subject !== subjectFilter) return false;
      if (typeFilter !== "all" && r.testType !== typeFilter) return false;
      return true;
    });
  }, [reports, subjectFilter, typeFilter]);

  // Group reports by subject
  const groupedBySubject = useMemo(() => {
    const groups: Record<string, typeof filteredReports> = {};
    filteredReports.forEach((r) => {
      const key = r.subject;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredReports]);

  // Summary stats
  const stats = useMemo(() => {
    if (!reports || reports.length === 0)
      return { total: 0, baseline: 0, levelTest: 0, passed: 0, failed: 0, avgScore: 0 };
    const baseline = reports.filter((r) => r.testType === "baseline").length;
    const levelTests = reports.filter((r) => r.testType === "level_test");
    const passed = levelTests.filter((r) => r.passed === true).length;
    const failed = levelTests.filter((r) => r.passed === false).length;
    const totalScore = reports.reduce((sum, r) => sum + (r.score || 0), 0);
    return {
      total: reports.length,
      baseline,
      levelTest: levelTests.length,
      passed,
      failed,
      avgScore: Math.round(totalScore / reports.length),
    };
  }, [reports]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/students");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Failed to load test report"}
            </p>
            <Button onClick={handleBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold">{student.name}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                {student.roll_no && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Roll: {student.roll_no}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <School className="h-3.5 w-3.5" />
                  Class {student.class}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-bold">{stats.total}</span>
              <span className="text-sm text-muted-foreground">Tests</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.baseline}</p>
            <p className="text-xs text-blue-600">Baseline Tests</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.levelTest}</p>
            <p className="text-xs text-purple-600">Level Tests</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">{stats.avgScore}%</p>
            <p className="text-xs text-orange-600">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="baseline">Baseline</SelectItem>
            <SelectItem value="level_test">Level Test</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Test Reports - Grouped by Subject */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No test reports found
            </p>
          </CardContent>
        </Card>
      ) : (
        groupedBySubject.map(([subject, subjectReports]) => (
          <Card key={subject}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 capitalize">
                <FileText className="h-5 w-5" />
                {subject}
                <Badge variant="secondary" className="text-xs ml-auto">
                  {subjectReports.length} tests
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile: Card layout */}
              <div className="sm:hidden space-y-3">
                {subjectReports.map((report) => (
                  <div
                    key={report._id}
                    className={`border rounded-lg p-4 space-y-2 ${
                      report.passed === true
                        ? "border-green-200 bg-green-50/50"
                        : report.passed === false
                        ? "border-red-200 bg-red-50/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Level {report.level}</Badge>
                      <Badge
                        variant={
                          report.testType === "baseline" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {report.testType === "baseline" ? "Baseline" : "Level Test"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(report.date).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          report.score >= 75
                            ? "text-green-600"
                            : report.score >= 50
                            ? "text-orange-600"
                            : "text-red-600"
                        }`}
                      >
                        {report.correctAnswers}/{report.totalQuestions} ({report.score.toFixed(1)}%)
                      </span>
                    </div>
                    {report.passed !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Result</span>
                        <Badge
                          variant="outline"
                          className={
                            report.passed
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-red-100 text-red-700 border-red-300"
                          }
                        >
                          {report.passed ? "Pass" : "Fail"}
                        </Badge>
                      </div>
                    )}
                    {report.action && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Action</span>
                        <Badge
                          variant="outline"
                          className={
                            report.action === "jump"
                              ? "text-blue-600 border-blue-300"
                              : "text-green-600 border-green-300"
                          }
                        >
                          {report.action === "jump" ? "Jump" : "Assigned"}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Mentor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectReports.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell>
                          {new Date(report.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.testType === "baseline"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {report.testType === "baseline"
                              ? "Baseline"
                              : "Level Test"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Level {report.level}</Badge>
                        </TableCell>
                        <TableCell>
                          {report.correctAnswers}/{report.totalQuestions}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              report.score >= 75
                                ? "text-green-600"
                                : report.score >= 50
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {report.score.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {report.passed !== null ? (
                            <div className="flex items-center gap-1">
                              {report.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span
                                className={
                                  report.passed
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {report.passed ? "Pass" : "Fail"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.action === "jump" ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">Jump</Badge>
                          ) : report.action === "assigned" ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">Assigned</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.mentor &&
                          typeof report.mentor === "object" &&
                          report.mentor !== null
                            ? report.mentor.name || "Unknown"
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
