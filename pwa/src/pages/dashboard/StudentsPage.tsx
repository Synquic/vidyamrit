import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudents } from "@/services/students";
import type { Student } from "@/services/students";
import { getSchools } from "@/services/schools";
import { getAssessments } from "@/services/assessments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

// Define populated assessment interface
interface PopulatedAssessment {
  _id: string;
  student: {
    _id: string;
    roll_no: string;
    name: string;
  };
  school: {
    _id: string;
    name: string;
  };
  mentor: {
    _id: string;
    name: string;
  };
  subject: "hindi" | "math" | "english";
  level: number;
  date: string;
}

function StudentsPage() {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch students with optional school filter
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students", selectedSchool],
    queryFn: () => getStudents(selectedSchool),
  });

  // Fetch schools for the filter dropdown
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Fetch all assessments
  const { data: assessments = [], isLoading: isLoadingAssessments } = useQuery({
    queryKey: ["assessments"],
    queryFn: getAssessments,
  });

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper: get all assessments for a student
  const getStudentAssessments = (studentId: string): PopulatedAssessment[] => {
    return (assessments as unknown as PopulatedAssessment[])
      .filter((a) => a.student._id === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Helper: get latest level from student's knowledgeLevel array
  const getLatestLevel = (student: Student) => {
    if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
      return student.knowledgeLevel[student.knowledgeLevel.length - 1].level;
    }
    return null;
  };

  if (isLoadingStudents || isLoadingAssessments) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students Report</h1>
        <p className="text-muted-foreground">
          Comprehensive view of all student data, assessments, and progress
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={selectedSchool || "all"}
          onValueChange={(v) => setSelectedSchool(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by school" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools.map(
              (school) =>
                school._id && (
                  <SelectItem key={school._id} value={school._id}>
                    {school.name}
                  </SelectItem>
                )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <div className="rounded-md border">
        <ScrollArea className="h-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Info</TableHead>
                <TableHead>School & Class</TableHead>
                <TableHead>Assessment Levels</TableHead>
                <TableHead>Assessment History</TableHead>
                <TableHead>Cohort Info</TableHead>
                <TableHead>Contact Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const studentAssessments = getStudentAssessments(student._id);
                  const latestLevel = getLatestLevel(student);
                  const latestAssessment = studentAssessments[0];

                  return (
                    <TableRow key={student._id} className="h-auto">
                      {/* Student Info */}
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-semibold">{student.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Roll: {student.roll_no}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Age: {student.age} | {student.gender}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Caste: {student.caste}
                          </div>
                        </div>
                      </TableCell>

                      {/* School & Class */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {student.schoolId.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Class: {student.class}
                          </div>
                          <Badge
                            variant={student.schoolId ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {student.schoolId ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Assessment Levels */}
                      <TableCell>
                        <div className="space-y-2">
                          {latestLevel ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-xs">
                                CURRENT LEVEL
                              </Badge>
                              <span className="text-sm font-medium">
                                Level {latestLevel}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No assessments
                            </span>
                          )}
                          {student.knowledgeLevel &&
                            student.knowledgeLevel.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                ({student.knowledgeLevel.length} assessments)
                              </div>
                            )}
                        </div>
                      </TableCell>

                      {/* Assessment History */}
                      <TableCell>
                        <div className="space-y-1 max-w-[200px]">
                          {latestAssessment ? (
                            <div className="space-y-1">
                              <div className="text-xs font-semibold">
                                Latest Assessment:
                              </div>
                              <div className="text-xs">
                                {latestAssessment.subject.toUpperCase()} - Level{" "}
                                {latestAssessment.level}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  latestAssessment.date
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No assessments
                            </span>
                          )}
                          {studentAssessments.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              +{studentAssessments.length - 1} more assessments
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Cohort Info */}
                      <TableCell>
                        <div className="space-y-1">
                          {student.cohort && student.cohort.length > 0 ? (
                            student.cohort.map((cohortInfo, index) => (
                              <div key={index} className="text-xs">
                                <div className="font-medium">Cohort Member</div>
                                <div className="text-muted-foreground">
                                  Joined:{" "}
                                  {new Date(
                                    cohortInfo.dateJoined
                                  ).toLocaleDateString()}
                                </div>
                                {cohortInfo.dateLeaved && (
                                  <div className="text-muted-foreground">
                                    Left:{" "}
                                    {new Date(
                                      cohortInfo.dateLeaved
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No cohort
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell>
                        <div className="space-y-1 max-w-[180px]">
                          {student.contactInfo &&
                          student.contactInfo.length > 0 ? (
                            student.contactInfo
                              .slice(0, 2)
                              .map((contact, index) => (
                                <div key={index} className="text-xs space-y-1">
                                  <div className="font-medium">
                                    {contact.name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {contact.relation}
                                  </div>
                                  {contact.phone_no && (
                                    <div className="text-muted-foreground">
                                      📞 {contact.phone_no}
                                    </div>
                                  )}
                                  {contact.occupation && (
                                    <div className="text-muted-foreground text-xs">
                                      {contact.occupation}
                                    </div>
                                  )}
                                </div>
                              ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No contact info
                            </span>
                          )}
                          {student.contactInfo &&
                            student.contactInfo.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{student.contactInfo.length - 2} more contacts
                              </div>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{filteredStudents.length}</div>
          <div className="text-sm text-muted-foreground">Total Students</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{schools.length}</div>
          <div className="text-sm text-muted-foreground">Schools</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {(assessments as unknown as PopulatedAssessment[]).length}
          </div>
          <div className="text-sm text-muted-foreground">Total Assessments</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {
              filteredStudents.filter(
                (s) => getStudentAssessments(s._id).length > 0
              ).length
            }
          </div>
          <div className="text-sm text-muted-foreground">Students Assessed</div>
        </div>
      </div>

      {/* Assessment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-lg font-semibold mb-2">Assessment Progress</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Assessed Students:</span>
              <span className="font-medium">
                {
                  filteredStudents.filter(
                    (s) => getStudentAssessments(s._id).length > 0
                  ).length
                }{" "}
                / {filteredStudents.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Assessments/Student:</span>
              <span className="font-medium">
                {filteredStudents.length > 0
                  ? (
                      (assessments as unknown as PopulatedAssessment[]).length /
                      filteredStudents.length
                    ).toFixed(1)
                  : "0"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-lg font-semibold mb-2">Subject Distribution</div>
          <div className="space-y-2">
            {["hindi", "math", "english"].map((subject) => {
              const subjectAssessments = (
                assessments as unknown as PopulatedAssessment[]
              ).filter((a) => a.subject === subject);
              return (
                <div key={subject} className="flex justify-between text-sm">
                  <span className="capitalize">{subject}:</span>
                  <span className="font-medium">
                    {subjectAssessments.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-lg font-semibold mb-2">Cohort Participation</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>In Cohorts:</span>
              <span className="font-medium">
                {
                  filteredStudents.filter(
                    (s) => s.cohort && s.cohort.length > 0
                  ).length
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>No Cohort:</span>
              <span className="font-medium">
                {
                  filteredStudents.filter(
                    (s) => !s.cohort || s.cohort.length === 0
                  ).length
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentsPage;
