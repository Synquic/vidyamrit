import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyViewData } from "@/services/views";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import { AUTH_ROUTE_PATHS } from "@/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  School,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Calendar,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SectionKey =
  | "overview"
  | "schools"
  | "tutors"
  | "students"
  | "cohorts"
  | "assessments"
  | "progress"
  | "attendance";

interface SidebarItem {
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
}

function ViewDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = AUTH_ROUTE_PATHS.logout;
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const {
    data: viewData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myViewData"],
    queryFn: getMyViewData,
    retry: 1,
  });

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (!viewData?.data) return [];
    const items: SidebarItem[] = [
      {
        key: "overview",
        label: "Overview",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ];
    const { data } = viewData;
    if (data.schools)
      items.push({
        key: "schools",
        label: "Schools",
        icon: <School className="h-4 w-4" />,
      });
    if (data.tutors)
      items.push({
        key: "tutors",
        label: "Tutors",
        icon: <Users className="h-4 w-4" />,
      });
    if (data.students)
      items.push({
        key: "students",
        label: "Students",
        icon: <GraduationCap className="h-4 w-4" />,
      });
    if (data.cohorts)
      items.push({
        key: "cohorts",
        label: "Groups",
        icon: <BookOpen className="h-4 w-4" />,
      });
    if (data.assessments)
      items.push({
        key: "assessments",
        label: "Tests",
        icon: <ClipboardList className="h-4 w-4" />,
      });
    if (data.progress)
      items.push({
        key: "progress",
        label: "Progress",
        icon: <TrendingUp className="h-4 w-4" />,
      });
    if (data.attendance)
      items.push({
        key: "attendance",
        label: "Attendance",
        icon: <Calendar className="h-4 w-4" />,
      });
    return items;
  }, [viewData]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error loading view data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!viewData || !viewData.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No view data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data } = viewData;

  const hasNoData =
    !data.schools &&
    !data.tutors &&
    !data.students &&
    !data.cohorts &&
    !data.assessments &&
    !data.progress &&
    !data.attendance;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-white px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 capitalize">{viewData.viewName}</h1>
            {user && (
              <p className="text-xs text-gray-500">
                Welcome, {user.name}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>

      {hasNoData ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No data sections are enabled for this view.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Mobile Tabs - horizontal scroll */}
          <div className="md:hidden border-b overflow-x-auto shrink-0">
            <div className="flex min-w-max px-2 py-1 gap-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors",
                    activeSection === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Layout: Sidebar + Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-52 border-r flex-col shrink-0 p-3 gap-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left w-full",
                    activeSection === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="max-w-6xl mx-auto">
                {activeSection === "overview" && (
                  <OverviewSection data={data} />
                )}
                {activeSection === "schools" && data.schools && (
                  <SchoolsSection data={data.schools} />
                )}
                {activeSection === "tutors" && data.tutors && (
                  <TutorsSection data={data.tutors} />
                )}
                {activeSection === "students" && data.students && (
                  <StudentsSection data={data.students} />
                )}
                {activeSection === "cohorts" && data.cohorts && (
                  <GroupsSection data={data.cohorts} />
                )}
                {activeSection === "assessments" && data.assessments && (
                  <TestsSection data={data.assessments} />
                )}
                {activeSection === "progress" && data.progress && (
                  <ProgressSection data={data.progress} />
                )}
                {activeSection === "attendance" && data.attendance && (
                  <AttendanceSection data={data.attendance} />
                )}
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ Overview Section ============ */
function OverviewSection({ data }: { data: any }) {
  const overviewCards = [
    data.schools && {
      title: "Schools",
      icon: <School className="h-5 w-5 text-blue-600" />,
      bg: "from-blue-50 to-blue-100/50",
      border: "border-blue-200/50",
      iconBg: "bg-blue-500/10",
      mainValue: data.schools.total,
      mainColor: "text-blue-700",
      subColor: "text-blue-600/70",
      stats: [
        data.schools.active !== undefined && { label: "Active", value: data.schools.active },
        data.schools.withAssessments !== undefined && { label: "With Tests", value: data.schools.withAssessments },
      ].filter(Boolean),
    },
    data.tutors && {
      title: "Tutors",
      icon: <Users className="h-5 w-5 text-purple-600" />,
      bg: "from-purple-50 to-purple-100/50",
      border: "border-purple-200/50",
      iconBg: "bg-purple-500/10",
      mainValue: data.tutors.total,
      mainColor: "text-purple-700",
      subColor: "text-purple-600/70",
      stats: [
        data.tutors.engaged !== undefined && { label: "Engaged", value: data.tutors.engaged },
      ].filter(Boolean),
    },
    data.students && {
      title: "Students",
      icon: <GraduationCap className="h-5 w-5 text-emerald-600" />,
      bg: "from-emerald-50 to-emerald-100/50",
      border: "border-emerald-200/50",
      iconBg: "bg-emerald-500/10",
      mainValue: data.students.total,
      mainColor: "text-emerald-700",
      subColor: "text-emerald-600/70",
      stats: [
        data.students.active !== undefined && { label: "Active", value: data.students.active, color: "text-green-600" },
        data.students.dropped !== undefined && data.students.dropped > 0 && { label: "Dropped", value: data.students.dropped, color: "text-red-500" },
      ].filter(Boolean),
    },
    data.cohorts && {
      title: "Groups",
      icon: <BookOpen className="h-5 w-5 text-orange-600" />,
      bg: "from-orange-50 to-orange-100/50",
      border: "border-orange-200/50",
      iconBg: "bg-orange-500/10",
      mainValue: data.cohorts.total,
      mainColor: "text-orange-700",
      subColor: "text-orange-600/70",
      stats: [
        data.cohorts.active !== undefined && { label: "Active", value: data.cohorts.active },
      ].filter(Boolean),
    },
    data.assessments && {
      title: "Tests",
      icon: <ClipboardList className="h-5 w-5 text-indigo-600" />,
      bg: "from-indigo-50 to-indigo-100/50",
      border: "border-indigo-200/50",
      iconBg: "bg-indigo-500/10",
      mainValue: data.assessments.total,
      mainColor: "text-indigo-700",
      subColor: "text-indigo-600/70",
      stats: [],
    },
  ].filter(Boolean) as any[];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {overviewCards.map((card) => (
          <Card
            key={card.title}
            className={`bg-gradient-to-br ${card.bg} ${card.border} hover:shadow-lg transition-all duration-300`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${card.mainColor}`}>
                    {card.title}
                  </span>
                  <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                    {card.icon}
                  </div>
                </div>
                <p className={`text-3xl sm:text-4xl font-bold ${card.mainColor} tracking-tight`}>
                  {card.mainValue ?? 0}
                </p>
                {card.stats.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-black/5">
                    {card.stats.map((stat: any) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <span className={`text-xs ${card.subColor}`}>{stat.label}</span>
                        <span className={`text-sm font-semibold ${stat.color || card.mainColor}`}>
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============ Schools Section ============ */
function SchoolsSection({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          Schools Details
        </CardTitle>
        <CardDescription>
          Complete list of schools with all details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.details && data.details.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>UDISE Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Active Groups</TableHead>
                  <TableHead>Tutors</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details.map(
                  (school: {
                    schoolId: string;
                    name: string;
                    udise_code: string;
                    type: string;
                    block: string;
                    state: string;
                    city: string;
                    level: string;
                    studentCount: number;
                    cohortCount: number;
                    activeCohortCount: number;
                    tutorCount: number;
                    assessmentCount: number;
                    pointOfContact: string;
                    phone: string;
                  }) => (
                    <TableRow key={school.schoolId}>
                      <TableCell className="font-medium">
                        {school.name}
                      </TableCell>
                      <TableCell>{school.udise_code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {school.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{school.block}</TableCell>
                      <TableCell>{school.state}</TableCell>
                      <TableCell>{school.city}</TableCell>
                      <TableCell className="capitalize">
                        {school.level}
                      </TableCell>
                      <TableCell>{school.studentCount}</TableCell>
                      <TableCell>{school.cohortCount}</TableCell>
                      <TableCell>{school.activeCohortCount}</TableCell>
                      <TableCell>{school.tutorCount}</TableCell>
                      <TableCell>{school.assessmentCount}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>{school.pointOfContact}</div>
                          <div className="text-muted-foreground">
                            {school.phone}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No school details available.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ Tutors Section ============ */
function TutorsSection({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Tutors Details
        </CardTitle>
        <CardDescription>
          Complete list of tutors with their assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.details && data.details.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Active Groups</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details.map(
                  (tutor: {
                    tutorId: string;
                    name: string;
                    email: string;
                    phoneNo: string;
                    school: {
                      schoolId: string;
                      name: string;
                      block: string;
                      state: string;
                    } | null;
                    cohortCount: number;
                    activeCohortCount: number;
                    studentCount: number;
                    isActive: boolean;
                  }) => (
                    <TableRow key={tutor.tutorId}>
                      <TableCell className="font-medium">
                        {tutor.name}
                      </TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>{tutor.phoneNo}</TableCell>
                      <TableCell>
                        {tutor.school ? (
                          <div>
                            <div className="font-medium">
                              {tutor.school.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tutor.school.block}, {tutor.school.state}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{tutor.cohortCount}</TableCell>
                      <TableCell>{tutor.activeCohortCount}</TableCell>
                      <TableCell>{tutor.studentCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tutor.isActive ? "default" : "secondary"}
                        >
                          {tutor.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tutor details available.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ Students Section ============ */
function StudentsSection({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Students Details
        </CardTitle>
        <CardDescription>
          Complete list of students with their information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.details && data.details.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Latest Test</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details.map(
                  (student: {
                    studentId: string;
                    roll_no?: string;
                    name: string;
                    age: number;
                    gender: string;
                    class: string;
                    school: {
                      schoolId: string;
                      name: string;
                      block: string;
                    } | null;
                    cohortCount: number;
                    activeCohortCount: number;
                    assessmentCount: number;
                    latestAssessment: {
                      type: string;
                      level: number;
                      date: string;
                    } | null;
                    isArchived: boolean;
                  }) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.roll_no || "N/A"}</TableCell>
                      <TableCell>{student.age}</TableCell>
                      <TableCell className="capitalize">
                        {student.gender}
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>
                        {student.school ? (
                          <div>
                            <div className="font-medium">
                              {student.school.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {student.school.block}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{student.cohortCount} total</div>
                          <div className="text-xs text-muted-foreground">
                            {student.activeCohortCount} active
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.assessmentCount}</TableCell>
                      <TableCell>
                        {student.latestAssessment ? (
                          <div className="text-xs">
                            <div>
                              {student.latestAssessment.type} - Level{" "}
                              {student.latestAssessment.level}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(
                                student.latestAssessment.date
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.isArchived ? "secondary" : "default"
                          }
                        >
                          {student.isArchived ? "Archived" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No student details available.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ Groups Section ============ */
function GroupsSection({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Groups Details
        </CardTitle>
        <CardDescription>
          Complete list of groups with performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.details && data.details.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Current Level</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Average Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details.map(
                  (cohort: {
                    cohortId: string;
                    name: string;
                    school: {
                      schoolId: string;
                      name: string;
                      block: string;
                    } | null;
                    tutor: {
                      tutorId: string;
                      name: string;
                      email: string;
                    } | null;
                    program: {
                      programId: string;
                      name: string;
                      subject: string;
                    } | null;
                    currentLevel: number;
                    studentCount: number;
                    attendanceRate: number;
                    averageLevel: number;
                    status: string;
                    startDate: string;
                  }) => (
                    <TableRow key={cohort.cohortId}>
                      <TableCell className="font-medium">
                        {cohort.name}
                      </TableCell>
                      <TableCell>
                        {cohort.school ? (
                          <div>
                            <div className="font-medium">
                              {cohort.school.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cohort.school.block}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {cohort.tutor ? (
                          <div>
                            <div className="font-medium">
                              {cohort.tutor.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cohort.tutor.email}
                            </div>
                          </div>
                        ) : (
                          "No tutor"
                        )}
                      </TableCell>
                      <TableCell>
                        {cohort.program ? (
                          <div>
                            <div className="font-medium">
                              {cohort.program.name}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {cohort.program.subject}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge>Level {cohort.currentLevel}</Badge>
                      </TableCell>
                      <TableCell>{cohort.studentCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cohort.attendanceRate >= 75
                              ? "default"
                              : cohort.attendanceRate >= 50
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {cohort.attendanceRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        Level {cohort.averageLevel.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cohort.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {cohort.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(cohort.startDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No group details available.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ Tests Section ============ */
function TestsSection({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Tests Details
        </CardTitle>
        <CardDescription>Complete list of tests conducted</CardDescription>
      </CardHeader>
      <CardContent>
        {data.details && data.details.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details.map(
                  (assessment: {
                    assessmentId: string;
                    type: string;
                    level: number;
                    score: number | null;
                    student: {
                      name: string;
                      roll_no?: string;
                      class: string;
                    } | null;
                    school: { name: string; block: string } | null;
                    program: { name: string; subject: string } | null;
                    date: string;
                  }) => (
                    <TableRow key={assessment.assessmentId}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {assessment.type
                            ? assessment.type.replace("_", " ")
                            : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assessment.student ? (
                          <div>
                            <div className="font-medium">
                              {assessment.student.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {assessment.student.roll_no} - Class{" "}
                              {assessment.student.class}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {assessment.school ? (
                          <div>
                            <div className="font-medium">
                              {assessment.school.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {assessment.school.block}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {assessment.program ? (
                          <div>
                            <div className="font-medium">
                              {assessment.program.name}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {assessment.program.subject}
                            </div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge>Level {assessment.level}</Badge>
                      </TableCell>
                      <TableCell>
                        {assessment.score !== null ? (
                          <span className="font-semibold">
                            {assessment.score}%
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(assessment.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No test details available.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ Progress Section ============ */
function ProgressSection({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Progress Tracking
      </h2>

      {data.student && data.student.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Latest Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>FLN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.student.map(
                    (student: {
                      studentId: string;
                      name: string;
                      latestLevel: number;
                      status: string;
                      fln: Array<{ program: string; subject: string; clearedAt: string }>;
                    }) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>
                          <Badge>Level {student.latestLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              student.status === "progressing"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : student.status === "not_progressing"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }
                          >
                            {student.status === "progressing"
                              ? "Progressing"
                              : student.status === "not_progressing"
                              ? "Not Progressing"
                              : "Not Assessed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.fln && student.fln.length > 0 ? (
                            <Badge className="bg-green-600 text-white text-xs flex flex-col items-center gap-0.5 py-1 px-2 w-fit">
                              <span className="font-semibold">✓ Proficient</span>
                              <span className="font-normal lowercase">
                                {student.fln.map((f) => f.subject).join(" • ")}
                              </span>
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.cohort && data.cohort.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Group Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Current Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cohort.map(
                    (cohort: {
                      cohortId: string;
                      name: string;
                      currentLevel: number;
                      status: string;
                      progressCount: number;
                    }) => (
                      <TableRow key={cohort.cohortId}>
                        <TableCell className="font-medium">
                          {cohort.name}
                        </TableCell>
                        <TableCell>
                          <Badge>Level {cohort.currentLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              cohort.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {cohort.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{cohort.progressCount}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.school && data.school.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">School Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Groups</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.school.map(
                    (school: {
                      schoolId: string;
                      name: string;
                      block?: string;
                      state: string;
                      studentCount: number;
                      cohortCount: number;
                    }) => (
                      <TableRow key={school.schoolId}>
                        <TableCell className="font-medium">
                          {school.name}
                        </TableCell>
                        <TableCell>{school.block || "N/A"}</TableCell>
                        <TableCell>{school.state}</TableCell>
                        <TableCell>{school.studentCount}</TableCell>
                        <TableCell>{school.cohortCount}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.block && data.block.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Block Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Block</TableHead>
                    <TableHead>Schools</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Groups</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.block.map(
                    (block: {
                      block: string;
                      schoolCount: number;
                      studentCount: number;
                      cohortCount: number;
                    }) => (
                      <TableRow key={block.block}>
                        <TableCell className="font-medium">
                          {block.block}
                        </TableCell>
                        <TableCell>{block.schoolCount}</TableCell>
                        <TableCell>{block.studentCount}</TableCell>
                        <TableCell>{block.cohortCount}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.state && data.state.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">State Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Schools</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Groups</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.state.map(
                    (state: {
                      state: string;
                      schoolCount: number;
                      studentCount: number;
                      cohortCount: number;
                    }) => (
                      <TableRow key={state.state}>
                        <TableCell className="font-medium">
                          {state.state}
                        </TableCell>
                        <TableCell>{state.schoolCount}</TableCell>
                        <TableCell>{state.studentCount}</TableCell>
                        <TableCell>{state.cohortCount}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.program && data.program.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Program Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.program.map(
                    (program: {
                      programId: string;
                      name: string;
                      subject: string;
                      cohortCount: number;
                      studentCount: number;
                    }) => (
                      <TableRow key={program.programId}>
                        <TableCell className="font-medium">
                          {program.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {program.subject}
                        </TableCell>
                        <TableCell>{program.cohortCount}</TableCell>
                        <TableCell>{program.studentCount}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ============ Attendance Section ============ */
function AttendanceSection({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Attendance Tracking
      </h2>

      {data.student && data.student.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.student.map(
                    (student: {
                      studentId: string;
                      studentName: string;
                      present: number;
                      absent: number;
                      total: number;
                      attendanceRate: number;
                    }) => (
                      <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                          {student.studentName}
                        </TableCell>
                        <TableCell>{student.present}</TableCell>
                        <TableCell>{student.absent}</TableCell>
                        <TableCell>{student.total}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.attendanceRate >= 75
                                ? "default"
                                : student.attendanceRate >= 50
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {student.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.cohort && data.cohort.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Group Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cohort.map(
                    (cohort: {
                      cohortId: string;
                      name: string;
                      studentCount: number;
                      present: number;
                      absent: number;
                      total: number;
                      attendanceRate: number;
                    }) => (
                      <TableRow key={cohort.cohortId}>
                        <TableCell className="font-medium">
                          {cohort.name}
                        </TableCell>
                        <TableCell>{cohort.studentCount}</TableCell>
                        <TableCell>{cohort.present}</TableCell>
                        <TableCell>{cohort.absent}</TableCell>
                        <TableCell>{cohort.total}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              cohort.attendanceRate >= 75
                                ? "default"
                                : cohort.attendanceRate >= 50
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {cohort.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.school && data.school.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">School Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.school.map(
                    (school: {
                      schoolId: string;
                      schoolName: string;
                      present: number;
                      absent: number;
                      total: number;
                      attendanceRate: number;
                    }) => (
                      <TableRow key={school.schoolId}>
                        <TableCell className="font-medium">
                          {school.schoolName}
                        </TableCell>
                        <TableCell>{school.present}</TableCell>
                        <TableCell>{school.absent}</TableCell>
                        <TableCell>{school.total}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              school.attendanceRate >= 75
                                ? "default"
                                : school.attendanceRate >= 50
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {school.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.block && data.block.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Block Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Block</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.block.map(
                    (block: {
                      block: string;
                      present: number;
                      absent: number;
                      total: number;
                      attendanceRate: number;
                    }) => (
                      <TableRow key={block.block}>
                        <TableCell className="font-medium">
                          {block.block}
                        </TableCell>
                        <TableCell>{block.present}</TableCell>
                        <TableCell>{block.absent}</TableCell>
                        <TableCell>{block.total}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              block.attendanceRate >= 75
                                ? "default"
                                : block.attendanceRate >= 50
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {block.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.state && data.state.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">State Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.state.map(
                    (state: {
                      state: string;
                      present: number;
                      absent: number;
                      total: number;
                      attendanceRate: number;
                    }) => (
                      <TableRow key={state.state}>
                        <TableCell className="font-medium">
                          {state.state}
                        </TableCell>
                        <TableCell>{state.present}</TableCell>
                        <TableCell>{state.absent}</TableCell>
                        <TableCell>{state.total}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              state.attendanceRate >= 75
                                ? "default"
                                : state.attendanceRate >= 50
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {state.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ViewDashboard;
