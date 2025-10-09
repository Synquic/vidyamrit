"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getSchools } from "@/services/schools";
import {
  getProgressStatistics,
  type ProgressFlag,
  type Subject,
  getProgressFlagColor,
} from "@/services/progress";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Flag,
} from "lucide-react";

export default function ProgressMonitoringPage() {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | "all">(
    "all"
  );
  const [selectedFlag, setSelectedFlag] = useState<ProgressFlag | "all">("all");

  // Fetch schools
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Fetch progress statistics
  const { data: progressStats, isLoading: isLoadingStats } = useQuery({
    queryKey: [
      "progressStatistics",
      selectedSchool,
      selectedSubject,
      selectedFlag,
    ],
    queryFn: () =>
      getProgressStatistics(
        selectedSchool || undefined,
        selectedSubject === "all" ? undefined : selectedSubject,
        selectedFlag === "all" ? undefined : selectedFlag
      ),
    enabled: !!selectedSchool,
  });

  const getFlagIcon = (flag: ProgressFlag) => {
    switch (flag) {
      case "excelling":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "improving":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "average":
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      case "struggling":
        return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case "needs_attention":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Flag className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Progress Monitoring
        </h1>
        <p className="text-muted-foreground">
          Monitor and track student progress with visual indicators
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Progress Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={selectedSubject}
              onValueChange={(value) =>
                setSelectedSubject(value as Subject | "all")
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
            <Label htmlFor="flag">Progress Flag</Label>
            <Select
              value={selectedFlag}
              onValueChange={(value) =>
                setSelectedFlag(value as ProgressFlag | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All flags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flags</SelectItem>
                <SelectItem value="excelling">Excelling</SelectItem>
                <SelectItem value="improving">Improving</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="struggling">Struggling</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {progressStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {progressStats.statistics.overall.excelling || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Excelling
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {progressStats.statistics.overall.improving || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Improving
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">
                {progressStats.statistics.overall.average || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Average
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {progressStats.statistics.overall.struggling || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Struggling
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {progressStats.statistics.overall.needs_attention || 0}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Needs Attention
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Progress Table */}
      {selectedSchool && progressStats?.students && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Progress Details
            </CardTitle>
            <CardDescription>
              Detailed progress flags and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="text-center py-8">Loading progress data...</div>
            ) : progressStats.students.length === 0 ? (
              <div className="text-center py-8">
                No progress data found for selected filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Hindi</TableHead>
                    <TableHead>Math</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>Overall Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressStats.students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.school}</TableCell>
                      <TableCell>
                        {student.hindiFlag ? (
                          <Badge
                            className={getProgressFlagColor(student.hindiFlag)}
                          >
                            {getFlagIcon(student.hindiFlag)}
                            {student.hindiFlag}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.mathFlag ? (
                          <Badge
                            className={getProgressFlagColor(student.mathFlag)}
                          >
                            {getFlagIcon(student.mathFlag)}
                            {student.mathFlag}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.englishFlag ? (
                          <Badge
                            className={getProgressFlagColor(
                              student.englishFlag
                            )}
                          >
                            {getFlagIcon(student.englishFlag)}
                            {student.englishFlag}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="outline">
                            Level: {student.levels.hindi || 0}H /{" "}
                            {student.levels.math || 0}M /{" "}
                            {student.levels.english || 0}E
                          </Badge>
                        </div>
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
