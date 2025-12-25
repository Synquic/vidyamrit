"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Users,
  GraduationCap,
  BookOpen,
  Table as TableIcon,
} from "lucide-react";
import { getStudents, Student } from "@/services/students";
import { getSchools, School } from "@/services/schools";
import { programsService, IProgram } from "@/services/programs";
import { getAssessments, Assessment } from "@/services/assessments";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
import { useNavigate } from "react-router";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

interface StudentDistributionReportProps {
  onBack: () => void;
}

interface StudentLevelInfo {
  subject: string;
  programName: string;
  level: number;
  date: string;
  programId: string;
}

type ViewType = "level" | "class" | "category";

const COLORS = [
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
];

export default function StudentDistributionReport({
  onBack,
}: StudentDistributionReportProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>("level");
  console.log(schools);
  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      navigate(DASHBOARD_ROUTE_PATHS.dashboard);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, schoolsData, programsData, assessmentsData] =
        await Promise.all([
          getStudents(),
          getSchools(),
          programsService.getPrograms({ isActive: "true" }),
          getAssessments(),
        ]);

      setStudents(studentsData);
      setSchools(schoolsData);
      setPrograms(programsData.programs || []);
      setAssessments(assessmentsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get student level info
  const getStudentLevelInfo = (student: Student): StudentLevelInfo[] => {
    const subjectLevels: Record<string, StudentLevelInfo> = {};

    // Priority 1: Check new data structure
    if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
      let hasNewStructure = false;

      student.knowledgeLevel.forEach((kl: any) => {
        if (kl && kl.program && kl.subject && kl.level && kl.date) {
          hasNewStructure = true;
          const subject = kl.subject;
          const programId =
            typeof kl.program === "string" ? kl.program : kl.program.toString();

          if (
            !subjectLevels[subject] ||
            new Date(kl.date) > new Date(subjectLevels[subject].date)
          ) {
            subjectLevels[subject] = {
              subject: subject,
              programName: kl.programName || subject,
              level:
                typeof kl.level === "number"
                  ? kl.level
                  : parseInt(kl.level) || 0,
              date:
                typeof kl.date === "string"
                  ? kl.date
                  : new Date(kl.date).toISOString(),
              programId: programId,
            };
          }
        }
      });

      if (hasNewStructure) {
        return Object.values(subjectLevels).sort((a, b) =>
          a.subject.localeCompare(b.subject)
        );
      }
    }

    // Priority 2: Fallback to old structure
    const hasOldStructure =
      student.knowledgeLevel &&
      student.knowledgeLevel.some(
        (kl: any) => kl && kl.level && kl.date && !kl.program && !kl.subject
      );

    if (hasOldStructure) {
      const studentAssessments = assessments.filter((assessment) => {
        const assessmentStudentId =
          typeof assessment.student === "string"
            ? assessment.student
            : (assessment.student as { _id?: string })?._id ||
              assessment.student;
        return assessmentStudentId === student._id;
      });

      const assessmentBySubject: Record<string, Assessment> = {};
      studentAssessments.forEach((assessment) => {
        const subject = assessment.subject;
        if (
          !assessmentBySubject[subject] ||
          new Date(assessment.date) >
            new Date(assessmentBySubject[subject].date)
        ) {
          assessmentBySubject[subject] = assessment;
        }
      });

      Object.values(assessmentBySubject).forEach((assessment) => {
        const subject = assessment.subject;
        const program = programs.find(
          (p) => p.subject.toLowerCase() === subject.toLowerCase()
        );

        if (program) {
          subjectLevels[subject] = {
            subject: subject,
            programName: program.name,
            level: assessment.level,
            date: assessment.date,
            programId: program._id,
          };
        }
      });
    }

    return Object.values(subjectLevels).sort((a, b) =>
      a.subject.localeCompare(b.subject)
    );
  };

  // Level-wise distribution with student details
  const levelWiseData = useMemo(() => {
    const levelCounts: Record<
      string,
      Record<number, { count: number; students: Student[] }>
    > = {};

    students.forEach((student) => {
      const levelInfo = getStudentLevelInfo(student);
      levelInfo.forEach((info) => {
        if (!levelCounts[info.subject]) {
          levelCounts[info.subject] = {};
        }
        if (!levelCounts[info.subject][info.level]) {
          levelCounts[info.subject][info.level] = { count: 0, students: [] };
        }
        levelCounts[info.subject][info.level].count += 1;
        levelCounts[info.subject][info.level].students.push(student);
      });
    });

    return Object.entries(levelCounts).map(([subject, levels]) => ({
      subject,
      data: Object.entries(levels).map(([level, data]) => ({
        level: parseInt(level),
        count: data.count,
        students: data.students,
      })),
    }));
  }, [students, assessments, programs]);

  // Class-wise distribution with student details
  const classWiseData = useMemo(() => {
    const classCounts: Record<string, { count: number; students: Student[] }> =
      {};

    students.forEach((student) => {
      const className = student.class || "Unknown";
      if (!classCounts[className]) {
        classCounts[className] = { count: 0, students: [] };
      }
      classCounts[className].count += 1;
      classCounts[className].students.push(student);
    });

    return Object.entries(classCounts)
      .map(([className, data]) => ({
        className,
        count: data.count,
        students: data.students,
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, [students]);

  // Category-wise distribution with student details
  const categoryWiseData = useMemo(() => {
    const categoryCounts: Record<
      string,
      { count: number; students: Student[] }
    > = {};

    students.forEach((student) => {
      const category = student.caste || "Not Specified";
      if (!categoryCounts[category]) {
        categoryCounts[category] = { count: 0, students: [] };
      }
      categoryCounts[category].count += 1;
      categoryCounts[category].students.push(student);
    });

    return Object.entries(categoryCounts).map(([category, data]) => ({
      category,
      count: data.count,
      students: data.students,
    }));
  }, [students]);

  // Class-wise level distribution for each subject
  const classWiseLevelData = useMemo(() => {
    const result: Record<
      string,
      Array<{
        className: string;
        totalStudents: number;
        levelDistribution: Record<number, number>;
      }>
    > = {};

    students.forEach((student) => {
      const levelInfo = getStudentLevelInfo(student);
      const className = student.class || "Unknown";

      levelInfo.forEach((info) => {
        if (!result[info.subject]) {
          result[info.subject] = [];
        }

        let classData = result[info.subject].find((c) => c.className === className);
        if (!classData) {
          classData = {
            className,
            totalStudents: 0,
            levelDistribution: {},
          };
          result[info.subject].push(classData);
        }

        classData.totalStudents += 1;
        classData.levelDistribution[info.level] =
          (classData.levelDistribution[info.level] || 0) + 1;
      });
    });

    // Sort classes naturally
    Object.keys(result).forEach((subject) => {
      result[subject].sort((a, b) => {
        const aNum = parseInt(a.className.match(/\d+/)?.[0] || "999");
        const bNum = parseInt(b.className.match(/\d+/)?.[0] || "999");
        if (aNum !== bNum) return aNum - bNum;
        return a.className.localeCompare(b.className);
      });
    });

    return result;
  }, [students, assessments, programs]);

  // Level-wise by subject chart data
  const levelChartData = useMemo(() => {
    const allLevels = new Set<number>();
    levelWiseData.forEach(({ data }) => {
      data.forEach(({ level }) => allLevels.add(level));
    });

    const levelsArray = Array.from(allLevels).sort((a, b) => a - b);

    return levelsArray.map((level) => {
      const dataPoint: any = { level: `Level ${level}` };
      levelWiseData.forEach(({ subject, data }) => {
        const levelData = data.find((d) => d.level === level);
        dataPoint[subject] = levelData?.count || 0;
      });
      return dataPoint;
    });
  }, [levelWiseData]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Distribution Report</h1>
          <p className="text-muted-foreground">
            View students by level, class, and category
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
      </div>

      {/* View Type Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>View Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={viewType === "level" ? "default" : "outline"}
              onClick={() => setViewType("level")}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Level-wise
            </Button>
            <Button
              variant={viewType === "class" ? "default" : "outline"}
              onClick={() => setViewType("class")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Class-wise
            </Button>
            <Button
              variant={viewType === "category" ? "default" : "outline"}
              onClick={() => setViewType("category")}
            >
              <Users className="mr-2 h-4 w-4" />
              Category-wise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Level-wise View */}
      {viewType === "level" && (
        <div className="space-y-6">
          {levelWiseData.map(({ subject, data }) => (
            <Card key={subject}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {subject} - Level Distribution
                </CardTitle>
                <CardDescription>
                  Number of students at each level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart - Class-wise with level segments */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Bar Chart - Class Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      {(() => {
                        const classData = classWiseLevelData[subject] || [];
                        const allLevels = new Set<number>();
                        data.forEach((d) => allLevels.add(d.level));
                        const sortedLevels = Array.from(allLevels).sort((a, b) => a - b);

                        // Transform data for stacked bar chart
                        const chartData = classData.map((classItem) => {
                          const dataPoint: any = { className: classItem.className };
                          sortedLevels.forEach((level) => {
                            dataPoint[`L${level}`] = classItem.levelDistribution[level] || 0;
                          });
                          return dataPoint;
                        });

                        return (
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="className" />
                            <YAxis />
                            <Tooltip
                              formatter={(value: number, name: string, props: any) => {
                                if (value === 0) return null;
                                const level = name.replace("L", "");
                                const className = props.payload?.className || "";
                                // Find the total students in this class
                                const classItem = classData.find(
                                  (c) => c.className === className
                                );
                                const classTotal = classItem?.totalStudents || 1;
                                const percentage =
                                  classTotal > 0
                                    ? ((value / classTotal) * 100).toFixed(1)
                                    : 0;
                                return [
                                  `Level ${level}: ${value} students (${percentage}% of ${className})`,
                                  "",
                                ];
                              }}
                            />
                            <Legend
                              formatter={(value: string) => {
                                return value.replace("L", "Level ");
                              }}
                            />
                            {sortedLevels.map((level, index) => (
                              <Bar
                                key={`level-${level}`}
                                dataKey={`L${level}`}
                                stackId="class"
                                fill={COLORS[index % COLORS.length]}
                                name={`L${level}`}
                              />
                            ))}
                          </BarChart>
                        );
                      })()}
                    </ResponsiveContainer>
                  </div>

                  {/* Pie Chart */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Pie Chart</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Tooltip
                          formatter={(
                            value: number,
                            _name: string,
                            props: any
                          ) => {
                            const total = data.reduce(
                              (sum, d) => sum + d.count,
                              0
                            );
                            const percentage =
                              total > 0
                                ? ((value / total) * 100).toFixed(1)
                                : 0;
                            const level = props?.payload?.level ?? "N/A";
                            return [
                              `Level ${level}: ${value} students (${percentage}%)`,
                              "",
                            ];
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(_value: any, entry: any) => {
                            const level = entry?.payload?.level ?? "N/A";
                            const count = entry?.payload?.count ?? 0;
                            return `Level ${level}: ${count}`;
                          }}
                        />
                        <Pie
                          data={[...data].sort((a, b) => a.level - b.level)}
                          cx="50%"
                          cy="45%"
                          labelLine={false}
                          label={(props: any) => {
                            const { level, percent } = props;
                            return (percent || 0) >= 0.05 ? `L${level}` : "";
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="level"
                        >
                          {[...data]
                            .sort((a, b) => a.level - b.level)
                            .map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Student Details Table */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Student Details
                  </h3>
                  <ScrollArea className="h-[400px] border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.flatMap(({ level, students }) =>
                          students.map((student, idx) => {
                            return (
                              <TableRow key={`${student._id}-${level}-${idx}`}>
                                <TableCell className="text-center font-medium text-muted-foreground">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell>
                                  {student.roll_no || "N/A"}
                                </TableCell>
                                <TableCell>{student.class || "N/A"}</TableCell>
                                <TableCell>{student.age || "N/A"}</TableCell>
                                <TableCell>{student.gender || "N/A"}</TableCell>
                                <TableCell>{student.caste || "N/A"}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    Level {level}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                        {data.reduce((sum, d) => sum + d.students.length, 0) ===
                          0 && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No students found for this subject
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Combined Level Chart */}
          {levelChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Subjects - Level Comparison</CardTitle>
                <CardDescription>
                  Compare level distribution across all subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={levelChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {levelWiseData.map(({ subject }, index) => (
                      <Bar
                        key={subject}
                        dataKey={subject}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Class-wise View */}
      {viewType === "class" && (
        <Card>
          <CardHeader>
            <CardTitle>Class-wise Distribution</CardTitle>
            <CardDescription>Number of students in each class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div>
                <h3 className="text-sm font-medium mb-4">Bar Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classWiseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div>
                <h3 className="text-sm font-medium mb-4">Pie Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip
                      formatter={(value: number, _name: string, props: any) => {
                        const total = classWiseData.reduce(
                          (sum, d) => sum + d.count,
                          0
                        );
                        const percentage =
                          total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        const className = props?.payload?.className ?? "N/A";
                        return [
                          `${className}: ${value} students (${percentage}%)`,
                          "Students",
                        ];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(_value: any, entry: any) => {
                        const className = entry?.payload?.className ?? "N/A";
                        const count = entry?.payload?.count ?? 0;
                        return `${className}: ${count}`;
                      }}
                    />
                    <Pie
                      data={classWiseData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={(props: any) => {
                        const { className, percent } = props;
                        // Only show label if segment is >= 5% of total
                        return (percent || 0) >= 0.05 ? className : "";
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="className"
                    >
                      {classWiseData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Details Table */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                Student Details
              </h3>
              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assessments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classWiseData.flatMap(({ className, students }) =>
                      students.map((student, idx) => {
                        const levelInfo = getStudentLevelInfo(student);
                        return (
                          <TableRow key={`${student._id}-${className}-${idx}`}>
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.name}
                            </TableCell>
                            <TableCell>{student.roll_no || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{className}</Badge>
                            </TableCell>
                            <TableCell>{student.age || "N/A"}</TableCell>
                            <TableCell>{student.gender || "N/A"}</TableCell>
                            <TableCell>{student.caste || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {levelInfo.length > 0 ? (
                                  levelInfo.map((info, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {info.subject}: L{info.level}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Not Assessed
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {classWiseData.reduce(
                      (sum, d) => sum + d.students.length,
                      0
                    ) === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category-wise View */}
      {viewType === "category" && (
        <Card>
          <CardHeader>
            <CardTitle>Category-wise Distribution</CardTitle>
            <CardDescription>
              Number of students in each category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div>
                <h3 className="text-sm font-medium mb-4">Bar Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryWiseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div>
                <h3 className="text-sm font-medium mb-4">Pie Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip
                      formatter={(value: number, _name: string, props: any) => {
                        const total = categoryWiseData.reduce(
                          (sum, d) => sum + d.count,
                          0
                        );
                        const percentage =
                          total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        const category = props?.payload?.category ?? "N/A";
                        return [
                          `${category}: ${value} students (${percentage}%)`,
                          "Students",
                        ];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(_value: any, entry: any) => {
                        const category = entry?.payload?.category ?? "N/A";
                        const count = entry?.payload?.count ?? 0;
                        return `${category}: ${count}`;
                      }}
                    />
                    <Pie
                      data={categoryWiseData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={(props: any) => {
                        const { category, percent } = props;
                        // Only show label if segment is >= 5% of total
                        return (percent || 0) >= 0.05 ? category : "";
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                    >
                      {categoryWiseData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Details Table */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                Student Details
              </h3>
              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assessments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryWiseData.flatMap(({ category, students }) =>
                      students.map((student, idx) => {
                        const levelInfo = getStudentLevelInfo(student);
                        return (
                          <TableRow key={`${student._id}-${category}-${idx}`}>
                            <TableCell className="text-center font-medium text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.name}
                            </TableCell>
                            <TableCell>{student.roll_no || "N/A"}</TableCell>
                            <TableCell>{student.class || "N/A"}</TableCell>
                            <TableCell>{student.age || "N/A"}</TableCell>
                            <TableCell>{student.gender || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {levelInfo.length > 0 ? (
                                  levelInfo.map((info, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {info.subject}: L{info.level}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Not Assessed
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {categoryWiseData.reduce(
                      (sum, d) => sum + d.students.length,
                      0
                    ) === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
