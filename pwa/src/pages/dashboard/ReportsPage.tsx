"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  School,
  Users,
  GraduationCap,
  Eye,
  Award,
  UserCheck,
  UserX,
  Calendar,
  BarChart3,
  PieChart,
  UserSearch,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { getSchools } from "@/services/schools";
import { getReportOverview, type ReportOverview } from "@/services/reports";
import StudentLevelsReport from "@/components/reports/StudentLevelsReport";
import StudentDistributionReport from "@/components/reports/StudentDistributionReport";
import StudentSearch from "@/components/reports/StudentSearch";
import IndividualStudentReport from "@/components/reports/IndividualStudentReport";
import { Student } from "@/services/students";
import { useAuth } from "@/hooks/useAuth";

type TabType = "school" | "class" | "student" | "legacy";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  const iconBg: Record<string, string> = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    orange: "bg-orange-100",
    red: "bg-red-100",
  };

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg[color]} rounded-xl flex items-center justify-center`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold">{value}</p>
            <p className="text-xs sm:text-sm font-medium opacity-80">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportContent({
  data,
  isLoading,
  showStudentList,
  hideCards,
}: {
  data: ReportOverview | undefined;
  isLoading: boolean;
  showStudentList?: boolean;
  hideCards?: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 sm:h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Select a school to view report</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      {!hideCards && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Calendar}
            label="Avg Attendance"
            value={`${data.avgAttendance}%`}
            color="blue"
          />
          <StatCard
            icon={Award}
            label="Proficient"
            value={data.proficientCount}
            color="green"
          />
          <StatCard
            icon={UserCheck}
            label="Active"
            value={data.activeCount}
            color="orange"
          />
          <StatCard
            icon={UserX}
            label="Inactive"
            value={data.inactiveCount}
            color="red"
          />
        </div>
      )}

      {/* Student List */}
      {showStudentList && data.students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Students ({data.students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.students.map((student, index) => (
                <div
                  key={student._id}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-muted-foreground w-6 flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Class {student.class}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/reports/student/${student._id}`)
                      }
                      className="flex-shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Report
                    </Button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
                    {student.fln && student.fln.length > 0 && student.fln.map((f, fi) => (
                      <Badge
                        key={fi}
                        variant="outline"
                        className={`text-xs ${f.source === "level_test" ? "bg-green-50 text-green-700 border-green-300" : "bg-blue-50 text-blue-700 border-blue-300"}`}
                      >
                        Proficient {f.source === "level_test" ? "Level" : "Baseline"}
                      </Badge>
                    ))}
                    {student.isArchived && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-300 text-xs"
                      >
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="hidden sm:flex sm:flex-wrap sm:gap-1 sm:mt-2">
                    {student.fln && student.fln.length > 0 && student.fln.map((f, fi) => (
                      <Badge
                        key={fi}
                        variant="outline"
                        className={`text-xs ${f.source === "level_test" ? "bg-green-50 text-green-700 border-green-300" : "bg-blue-50 text-blue-700 border-blue-300"}`}
                      >
                        Proficient {f.source === "level_test" ? "Level" : "Baseline"}
                      </Badge>
                    ))}
                    {student.isArchived && (
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-300 text-xs"
                      >
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Legacy report types
interface LegacyReport {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const legacyReports: LegacyReport[] = [
  {
    id: "student-levels",
    title: "Student Levels - Class & School Wise",
    description: "View student test levels grouped by school and class",
    icon: BarChart3,
  },
  {
    id: "student-distribution",
    title: "Student Distribution Analysis",
    description:
      "View students by level, class, and category with visual charts (all schools combined)",
    icon: PieChart,
  },
  {
    id: "individual-student",
    title: "Individual Student Report",
    description:
      "Generate comprehensive reports for individual students with detailed analytics",
    icon: UserSearch,
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();

  const [activeTab, setActiveTab] = useState<TabType>("school");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Legacy report state
  const [selectedLegacyReport, setSelectedLegacyReport] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const isTutor = user?.role === "tutor";
  const schoolId = isTutor
    ? selectedSchool?._id || (user as any)?.schoolId?._id || (user as any)?.schoolId || ""
    : selectedSchoolId;


  // Fetch schools for admin
  const { data: schools = [] } = useQuery({
    queryKey: ["schools-for-reports"],
    queryFn: getSchools,
    enabled: !isTutor,
  });

  // Fetch report data for school tab (also provides availableClasses for other tabs)
  const { data: schoolReport, isLoading: loadingSchool } = useQuery({
    queryKey: ["report-overview", schoolId, "school"],
    queryFn: () => getReportOverview(schoolId!),
    enabled: !!schoolId,
  });

  // Fetch report data for class tab
  const { data: classReport, isLoading: loadingClass } = useQuery({
    queryKey: ["report-overview", schoolId, "class", selectedClass],
    queryFn: () => getReportOverview(schoolId!, selectedClass),
    enabled:
      !!schoolId && activeTab === "class" && selectedClass !== "all",
  });

  // Fetch report data for student tab (with class filter)
  const { data: studentReport, isLoading: loadingStudent } = useQuery({
    queryKey: ["report-overview", schoolId, "student", selectedClass],
    queryFn: () =>
      getReportOverview(
        schoolId!,
        selectedClass !== "all" ? selectedClass : undefined
      ),
    enabled: !!schoolId && activeTab === "student",
  });

  // Get available classes from school report
  const availableClasses = useMemo(() => {
    const classes = schoolReport?.availableClasses || [];
    return classes.sort((a: string, b: string) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [schoolReport]);


  const tabs = [
    { id: "school" as TabType, label: "School", icon: School },
    { id: "class" as TabType, label: "Class", icon: Users },
    { id: "student" as TabType, label: "Student", icon: GraduationCap },
    ...(!isTutor
      ? [{ id: "legacy" as TabType, label: "Analytics", icon: BarChart3 }]
      : []),
  ];

  // Legacy report handling
  if (activeTab === "legacy") {
    if (selectedLegacyReport === "individual-student" && selectedStudent) {
      return (
        <IndividualStudentReport
          student={selectedStudent}
          onBack={() => setSelectedStudent(null)}
        />
      );
    }
    if (selectedLegacyReport === "individual-student" && !selectedStudent) {
      return (
        <StudentSearch
          onSelectStudent={(s) => setSelectedStudent(s)}
          onBack={() => setSelectedLegacyReport(null)}
        />
      );
    }
    if (selectedLegacyReport === "student-levels") {
      return (
        <StudentLevelsReport onBack={() => setSelectedLegacyReport(null)} />
      );
    }
    if (selectedLegacyReport === "student-distribution") {
      return (
        <StudentDistributionReport
          onBack={() => setSelectedLegacyReport(null)}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7" />
            Reports
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedClass("all");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-1 justify-center ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        {activeTab !== "legacy" && (
          <div className="flex flex-wrap gap-3 mb-6">
            {/* School Select (admin only) */}
            {!isTutor && (
              <div className="w-full sm:w-64">
                <Select
                  value={selectedSchoolId}
                  onValueChange={setSelectedSchoolId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((s: any) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Class Select (for student tab only) */}
            {activeTab === "student" && (
              <div className="w-full sm:w-48">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {availableClasses.map((cls: string) => (
                      <SelectItem key={cls} value={cls}>
                        Class {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === "school" && (
          <ReportContent data={schoolReport} isLoading={loadingSchool} />
        )}

        {activeTab === "class" && (
          <>
            {selectedClass === "all" ? (
              <div className="space-y-3">
                {loadingSchool ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : availableClasses.length > 0 ? (
                  availableClasses.map((cls: string) => {
                    const studentCount = schoolReport?.students?.filter(
                      (s: any) => s.class === cls
                    ).length || 0;
                    return (
                      <Card
                        key={cls}
                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                        onClick={() => setSelectedClass(cls)}
                      >
                        <CardContent className="py-4 px-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="font-semibold text-lg">Class {cls}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{studentCount} students</Badge>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No classes found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div>
                <Button
                  variant="ghost"
                  className="mb-4 gap-2"
                  onClick={() => setSelectedClass("all")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h3 className="text-lg font-semibold mb-4">Class {selectedClass}</h3>
                <ReportContent data={classReport} isLoading={loadingClass} />
              </div>
            )}
          </>
        )}

        {activeTab === "student" && (
          <ReportContent
            data={studentReport}
            isLoading={loadingStudent}
            showStudentList
            hideCards
          />
        )}

        {activeTab === "legacy" && !selectedLegacyReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {legacyReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedLegacyReport(report.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg md:text-xl">
                        {report.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {report.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Report
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
