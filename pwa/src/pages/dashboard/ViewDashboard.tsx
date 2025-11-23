import { useQuery } from "@tanstack/react-query";
import { getMyViewData } from "@/services/views";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

function ViewDashboard() {
  const { user } = useAuth();

  const {
    data: viewData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myViewData"],
    queryFn: getMyViewData,
    retry: 1,
  });

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
              Failed to load view data. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!viewData) {
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{viewData.viewName}</h1>
          {user && (
            <p className="text-muted-foreground mt-1">Welcome, {user.name}</p>
          )}
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Schools Metrics */}
          {data.schools && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Schools</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.schools.total !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total
                      </span>
                      <span className="text-2xl font-bold">
                        {data.schools.total}
                      </span>
                    </div>
                  )}
                  {data.schools.active !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Active
                      </span>
                      <span className="text-xl font-semibold">
                        {data.schools.active}
                      </span>
                    </div>
                  )}
                  {data.schools.withAssessments !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        With Assessments
                      </span>
                      <span className="text-xl font-semibold">
                        {data.schools.withAssessments}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tutors Metrics */}
          {data.tutors && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tutors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.tutors.total !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total
                      </span>
                      <span className="text-2xl font-bold">
                        {data.tutors.total}
                      </span>
                    </div>
                  )}
                  {data.tutors.engaged !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Engaged
                      </span>
                      <span className="text-xl font-semibold">
                        {data.tutors.engaged}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Students Metrics */}
          {data.students && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.students.total !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total
                      </span>
                      <span className="text-2xl font-bold">
                        {data.students.total}
                      </span>
                    </div>
                  )}
                  {data.students.active !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Active
                      </span>
                      <span className="text-xl font-semibold">
                        {data.students.active}
                      </span>
                    </div>
                  )}
                  {data.students.dropped !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Dropped
                      </span>
                      <span className="text-xl font-semibold">
                        {data.students.dropped}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cohorts Metrics */}
          {data.cohorts && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cohorts</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.cohorts.total !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total
                      </span>
                      <span className="text-2xl font-bold">
                        {data.cohorts.total}
                      </span>
                    </div>
                  )}
                  {data.cohorts.active !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Active
                      </span>
                      <span className="text-xl font-semibold">
                        {data.cohorts.active}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessments Metrics */}
          {data.assessments && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assessments
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.assessments.total !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total
                      </span>
                      <span className="text-2xl font-bold">
                        {data.assessments.total}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Schools List */}
        {data.schools?.details && data.schools.details.length > 0 && (
          <div className="mb-6">
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
                        <TableHead>Cohorts</TableHead>
                        <TableHead>Active Cohorts</TableHead>
                        <TableHead>Tutors</TableHead>
                        <TableHead>Assessments</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.schools.details.map(
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Tutors List */}
        {data.tutors?.details && data.tutors.details.length > 0 && (
          <div className="mb-6">
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Cohorts</TableHead>
                        <TableHead>Active Cohorts</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tutors.details.map(
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
                                variant={
                                  tutor.isActive ? "default" : "secondary"
                                }
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Students List */}
        {data.students?.details && data.students.details.length > 0 && (
          <div className="mb-6">
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
                        <TableHead>Cohorts</TableHead>
                        <TableHead>Assessments</TableHead>
                        <TableHead>Latest Assessment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.students.details.map(
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Cohorts List */}
        {data.cohorts?.details && data.cohorts.details.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Cohorts Details
                </CardTitle>
                <CardDescription>
                  Complete list of cohorts with performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cohort Name</TableHead>
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
                      {data.cohorts.details.map(
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Assessments List */}
        {data.assessments?.details && data.assessments.details.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Assessments Details
                </CardTitle>
                <CardDescription>
                  Complete list of assessments conducted
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      {data.assessments.details.map(
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Tracking */}
        {data.progress && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.progress.student && data.progress.student.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Student Progress
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Latest Level</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.progress.student.map(
                            (student: {
                              studentId: string;
                              name: string;
                              latestLevel: number;
                              progressFlags?: Record<string, string>;
                            }) => (
                              <TableRow key={student.studentId}>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell>
                                  <Badge>Level {student.latestLevel}</Badge>
                                </TableCell>
                                <TableCell>
                                  {student.progressFlags && (
                                    <div className="flex gap-2">
                                      {Object.entries(
                                        student.progressFlags || {}
                                      ).map(
                                        ([subject, flag]: [string, string]) => (
                                          <Badge
                                            key={subject}
                                            variant="outline"
                                            className="capitalize"
                                          >
                                            {subject}: {flag}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {data.progress.cohort && data.progress.cohort.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Cohort Progress
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cohort Name</TableHead>
                            <TableHead>Current Level</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.progress.cohort.map(
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
                  </div>
                )}

                {data.progress.school && data.progress.school.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      School Progress
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>School Name</TableHead>
                            <TableHead>Block</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Cohorts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.progress.school.map(
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
                  </div>
                )}

                {data.progress.block && data.progress.block.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Block Progress
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Block</TableHead>
                            <TableHead>Schools</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Cohorts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.progress.block.map(
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
                  </div>
                )}

                {data.progress.state && data.progress.state.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      State Progress
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>State</TableHead>
                            <TableHead>Schools</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Cohorts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.progress.state.map(
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
                  </div>
                )}

                {data.progress.program && data.progress.program.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Program Progress
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Program Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Cohorts</TableHead>
                            <TableHead>Students</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.progress.program.map(
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Tracking */}
        {data.attendance && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.attendance.student &&
                  data.attendance.student.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Student Attendance
                      </h3>
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
                            {data.attendance.student.map(
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
                    </div>
                  )}

                {data.attendance.cohort &&
                  data.attendance.cohort.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Cohort Attendance
                      </h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cohort Name</TableHead>
                              <TableHead>Students</TableHead>
                              <TableHead>Present</TableHead>
                              <TableHead>Absent</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Attendance Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.attendance.cohort.map(
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
                    </div>
                  )}

                {data.attendance.school &&
                  data.attendance.school.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">
                        School Attendance
                      </h3>
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
                            {data.attendance.school.map(
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
                    </div>
                  )}

                {data.attendance.block && data.attendance.block.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Block Attendance
                    </h3>
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
                          {data.attendance.block.map(
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
                  </div>
                )}

                {data.attendance.state && data.attendance.state.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      State Attendance
                    </h3>
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
                          {data.attendance.state.map(
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!data.schools &&
          !data.tutors &&
          !data.students &&
          !data.cohorts &&
          !data.assessments &&
          !data.progress &&
          !data.attendance && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No data sections are enabled for this view.
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}

export default ViewDashboard;
