"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BaselineAssessmentModal } from "@/components/BaselineAssessment";
import {
  getStudents,
  Student,
  createStudent,
  CreateStudentDTO,
} from "@/services/students";
import { getAssessments, Assessment } from "@/services/assessments";
import { programsService, IProgram } from "@/services/programs";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/types/user";
import { useSchoolContext } from "@/contexts/SchoolContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Users,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function BaselineAssessmentsPage() {
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [todaysAssessments, setTodaysAssessments] = useState<Assessment[]>([]);
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<CreateStudentDTO>>({
    name: "",
    age: 0,
    gender: "",
    class: "",
    caste: "",
    mobileNumber: "",
    aadharNumber: "",
    schoolId: "",
    contactInfo: [],
    knowledgeLevel: [],
    cohort: [],
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    // Only fetch students if we have a selected school from context
    if (selectedSchool && selectedSchool._id) {
      fetchStudents();
      fetchTodaysAssessments();
      if (selectedSchool._id) {
        fetchAllAssessments(selectedSchool._id);
      }
    }
  }, [selectedSchool]);

  // Function to check if a student was assessed today
  const isStudentAssessedToday = (student: Student) => {
    // Check by todaysAssessments first
    const assessedInTodaysAssessments = todaysAssessments.some(
      (assessment) => assessment.student === student._id
    );

    if (assessedInTodaysAssessments) return true;

    // Also check by knowledgeLevel with today's date
    if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const latestAssessment =
        student.knowledgeLevel[student.knowledgeLevel.length - 1];
      const assessmentDate = new Date(latestAssessment.date);

      return assessmentDate >= today && assessmentDate < tomorrow;
    }

    return false;
  };

  const fetchPrograms = async () => {
    try {
      const response = await programsService.getPrograms({ isActive: "true" });
      setPrograms(response.programs);
    } catch {
      setError("Failed to fetch programs");
    }
  };

  const fetchStudents = async () => {
    if (!selectedSchool?._id) return;

    try {
      const data = await getStudents(selectedSchool._id);
      setStudents(data);
      return data;
    } catch {
      setError("Failed to fetch students");
      return [];
    }
  };

  const fetchTodaysAssessments = async () => {
    try {
      const assessments = await getAssessments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysOnly = assessments.filter((assessment) => {
        const assessmentDate = new Date(assessment.date);
        return assessmentDate >= today && assessmentDate < tomorrow;
      });

      setTodaysAssessments(todaysOnly);
      return todaysOnly;
    } catch {
      // Don't show error for assessments, it's not critical
      setTodaysAssessments([]);
      return [];
    }
  };

  const fetchAllAssessments = async (schoolId: string) => {
    try {
      const assessments = await getAssessments();
      // Filter assessments by selected school
      const schoolAssessments = assessments.filter(
        (assessment) => assessment.school === schoolId
      );
      setAllAssessments(schoolAssessments);
      console.log(
        `Fetched ${schoolAssessments.length} assessments for school ${schoolId}`
      );
      return schoolAssessments;
    } catch (error) {
      // Don't show error for assessments, it's not critical
      console.error("Error fetching all assessments:", error);
      setAllAssessments([]);
      return [];
    }
  };

  const handleCreateStudent = async () => {
    if (!selectedSchool?._id) {
      toast.error("No school selected");
      return;
    }

    if (
      !newStudent.name ||
      !newStudent.age ||
      !newStudent.gender ||
      !newStudent.class
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);
      const studentData: CreateStudentDTO = {
        ...(newStudent as CreateStudentDTO),
        schoolId: selectedSchool._id,
      };

      const created = await createStudent(studentData);
      toast.success("Student created successfully!");

      // Reset form and close dialog
      setNewStudent({
        name: "",
        age: 0,
        gender: "",
        class: "",
        caste: "",
        mobileNumber: "",
        aadharNumber: "",
        schoolId: selectedSchool._id,
        contactInfo: [],
        knowledgeLevel: [],
        cohort: [],
      });
      setCreateStudentOpen(false);

      // Prepend created student to local list for immediate UI feedback
      setStudents((prev) => [created, ...(prev || [])]);

      // Refresh students list in background to keep data in sync
      fetchStudents();

      // Auto-start baseline assessment for the created student
      toast(`Starting baseline for ${created.name}...`, { duration: 1000 });
      setSelectedStudent(created);
      setModalOpen(true);
    } catch (error: any) {
      // Extract the error message from the server response
      let errorMessage = "Failed to create student";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      console.error("Error creating student:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // const handleStartTest = (_subject: string) => {
  //   if (!selectedStudent) {
  //     setError("Please select a student first.");
  //     return;
  //   }
  //   setModalOpen(true);
  // };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStudent(null); // Clear selection when modal closes
  };

  const handleAssessmentComplete = async () => {
    // Refresh students data and today's assessments to get updated levels
    if (selectedSchool?._id) {
      // Wait a moment for backend to process and ensure assessments are saved
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Refresh all data - fetch students and today's assessments first (they update more quickly)
      await Promise.all([fetchStudents(), fetchTodaysAssessments()]);

      // Then fetch all assessments (historical data)
      await fetchAllAssessments(selectedSchool._id);

      console.log("Assessment complete - data refreshed");
    }
    setModalOpen(false);
    setSelectedStudent(null);
  };

  // Helper function to get baseline completion status for a student by subject
  const getStudentBaselineStatus = (studentId: string, subject: string) => {
    // Find the student object
    const student = students.find((s) => s._id === studentId);

    // First check todaysAssessments (most up-to-date for today's assessments)
    const todayAssessments = todaysAssessments.filter(
      (assessment) =>
        assessment.student === studentId &&
        assessment.subject.toLowerCase() === subject.toLowerCase()
    );

    // Then check allAssessments (for historical assessments)
    const allTimeAssessments = allAssessments.filter(
      (assessment) =>
        assessment.student === studentId &&
        assessment.subject.toLowerCase() === subject.toLowerCase()
    );

    // Combine both, prioritizing todaysAssessments
    const allStudentAssessments = [...todayAssessments, ...allTimeAssessments];

    // Remove duplicates based on assessment _id
    const uniqueAssessments = Array.from(
      new Map(allStudentAssessments.map((a) => [a._id, a])).values()
    );

    // Console log for table data
    console.log("=== TABLE DATA ===");
    console.log("Student ID:", studentId);
    console.log("Subject:", subject);
    console.log("Student found:", student ? student.name : "NOT FOUND");
    console.log("Today's assessments for this subject:", todayAssessments);
    console.log("All assessments for this subject:", allTimeAssessments);
    console.log("Unique assessments:", uniqueAssessments);
    if (student) {
      console.log("Student hindi_level:", student.hindi_level);
      console.log("Student math_level:", student.math_level);
      console.log("Student english_level:", student.english_level);
      console.log("Student knowledgeLevel:", student.knowledgeLevel);
    }
    console.log("=========================");

    // If there are completed assessments, return the latest one
    if (uniqueAssessments.length > 0) {
      // Get the latest assessment for this subject
      const latestAssessment = uniqueAssessments.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      const result = {
        completed: true,
        level: latestAssessment.level,
        date: latestAssessment.date,
      };
      console.log("Returning assessment result:", result);
      return result;
    }

    // If no assessment found, check knowledgeLevel array as fallback (like dropdown does)
    // Note: knowledgeLevel doesn't have subject info, so we show it for all subjects when no assessment exists
    if (
      student &&
      student.knowledgeLevel &&
      student.knowledgeLevel.length > 0
    ) {
      const latestLevel =
        student.knowledgeLevel[student.knowledgeLevel.length - 1].level;
      const result = {
        completed: false,
        level: latestLevel,
        date: null,
      };
      console.log("Returning knowledgeLevel fallback result:", result);
      return result;
    }

    // No level found at all
    const result = { completed: false, level: null, date: null };
    console.log("Returning no level result:", result);
    return result;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Baseline Assessments</h1>
            <p className="text-muted-foreground mt-1">
              Create students and conduct baseline assessments
            </p>
          </div>
          <Dialog open={createStudentOpen} onOpenChange={setCreateStudentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Student</DialogTitle>
                <DialogDescription>
                  Add a new student to conduct baseline assessment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newStudent.name || ""}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number (Optional)</Label>
                  <Input
                    id="aadharNumber"
                    value={newStudent.aadharNumber || ""}
                    placeholder="Enter student aadhar number"
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        aadharNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
                  <Input
                    id="mobileNumber"
                    value={newStudent.mobileNumber || ""}
                    placeholder="Enter student mobile number"
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        mobileNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="age" className="text-xs">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={newStudent.age || ""}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          age: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="gender" className="text-xs">
                      Gender
                    </Label>
                    <Select
                      value={newStudent.gender || ""}
                      onValueChange={(value) =>
                        setNewStudent({ ...newStudent, gender: value })
                      }
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="caste" className="text-xs">
                      Category (Optional)
                    </Label>
                    <Select
                      value={newStudent.caste || ""}
                      onValueChange={(value) =>
                        setNewStudent({ ...newStudent, caste: value })
                      }
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="st">ST</SelectItem>
                        <SelectItem value="gen">GEN</SelectItem>
                        <SelectItem value="sc">SC</SelectItem>
                        <SelectItem value="obc">OBC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    value={newStudent.class || ""}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, class: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>School</Label>
                  <div className="p-3 border rounded-md bg-muted/50">
                    <div className="font-medium">
                      {selectedSchool?.name || "No school selected"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedSchool
                        ? "Students will be created for this school"
                        : "Please select a school from the sidebar"}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateStudentOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateStudent} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* School Selection - Only show for Super Admin */}
          {user && isSuperAdmin(user) && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Select School
                  </CardTitle>
                  <CardDescription>
                    Choose the school to manage assessments for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSchool ? (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          Current School
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {selectedSchool.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {selectedSchool.type}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-base font-semibold">
                        No school selected
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Please select a school from the sidebar
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student Selection - Only show if school is selected */}
          {selectedSchool?._id && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Select Student for Assessment
                  </CardTitle>
                  <CardDescription>
                    Choose a student who hasn't been assessed today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">
                        No students available
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Create your first student to start assessments
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>
                        All Students ({students.length}) - Green: Already
                        assessed today
                      </Label>
                      <Select
                        value={selectedStudent?._id || ""}
                        onValueChange={(value) => {
                          const student = students.find((s) => s._id === value);
                          console.log("=== STUDENT SELECTION DEBUG ===");
                          console.log("Selected student ID:", value);
                          console.log("Found student:", student);
                          console.log(
                            "Student object:",
                            JSON.stringify(student, null, 2)
                          );
                          console.log("Student schoolId:", student?.schoolId);
                          console.log(
                            "Student schoolId._id:",
                            student?.schoolId?._id
                          );
                          console.log("================================");

                          setSelectedStudent(student || null);
                          if (student) setModalOpen(true);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select a student to assess --" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => {
                            const isAssessedToday =
                              isStudentAssessedToday(student);
                            const latestLevel =
                              student.knowledgeLevel &&
                              student.knowledgeLevel.length > 0
                                ? student.knowledgeLevel[
                                    student.knowledgeLevel.length - 1
                                  ].level
                                : null;

                            // Console log for dropdown data
                            console.log("=== DROPDOWN DATA ===");
                            console.log("Student:", student.name);
                            console.log("Student ID:", student._id);
                            console.log(
                              "knowledgeLevel array:",
                              student.knowledgeLevel
                            );
                            console.log(
                              "Latest level from knowledgeLevel:",
                              latestLevel
                            );
                            console.log("hindi_level:", student.hindi_level);
                            console.log("math_level:", student.math_level);
                            console.log(
                              "english_level:",
                              student.english_level
                            );
                            console.log("=========================");

                            return (
                              <SelectItem
                                key={student._id}
                                value={student._id}
                                className={
                                  isAssessedToday
                                    ? "bg-green-100 hover:bg-green-200"
                                    : ""
                                }
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span
                                    className={
                                      isAssessedToday ? "text-green-800" : ""
                                    }
                                  >
                                    {student.name} (Roll: {student.roll_no})
                                    {isAssessedToday && " ✓"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {latestLevel && (
                                      <Badge
                                        variant={
                                          isAssessedToday
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="ml-2"
                                      >
                                        Level {latestLevel}
                                      </Badge>
                                    )}
                                    {isAssessedToday && (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-200 text-green-800 border-green-300"
                                      >
                                        Assessed Today
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedStudent && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Selected Student
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <strong>{selectedStudent.name}</strong>
                            <Badge variant="outline" className="ml-2">
                              Roll: {selectedStudent.roll_no}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            School: {selectedStudent.schoolId.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Class: {selectedStudent.class} | Age:{" "}
                            {selectedStudent.age}
                          </p>

                          {selectedStudent.knowledgeLevel &&
                          selectedStudent.knowledgeLevel.length > 0 ? (
                            <div className="mt-4">
                              <Label className="text-sm font-medium">
                                Assessment History
                              </Label>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Total Assessments:</span>
                                  <Badge>
                                    {selectedStudent.knowledgeLevel.length}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Latest Level:</span>
                                  <Badge variant="default">
                                    Level{" "}
                                    {
                                      selectedStudent.knowledgeLevel[
                                        selectedStudent.knowledgeLevel.length -
                                          1
                                      ].level
                                    }
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Last Assessment:</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      selectedStudent.knowledgeLevel[
                                        selectedStudent.knowledgeLevel.length -
                                          1
                                      ].date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4">
                              <Badge variant="outline">
                                No assessments completed yet
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Baseline Completion Table - Show all students with their program-wise baseline status */}
          {selectedSchool?._id &&
            students.length > 0 &&
            programs.length > 0 && (
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Baseline Assessment Status
                    </CardTitle>
                    <CardDescription>
                      Complete overview of all students and their baseline
                      assessment completion by program
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">
                              Student Name
                            </TableHead>
                            <TableHead className="w-[150px]">
                              Roll Number
                            </TableHead>
                            {programs.map((program) => (
                              <TableHead
                                key={program._id}
                                className="text-center min-w-[180px]"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-semibold capitalize">
                                    {program.subject}
                                  </span>
                                  <span className="text-xs font-normal text-muted-foreground">
                                    {program.name}
                                  </span>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => {
                            // Log all student data once per student
                            console.log("=== STUDENT TABLE ROW ===");
                            console.log(
                              "Student:",
                              student.name,
                              "(ID:",
                              student._id + ")"
                            );
                            console.log("Programs count:", programs.length);
                            programs.forEach((program) => {
                              console.log(
                                `  - Program: ${program.name}, Subject: ${program.subject}`
                              );
                            });
                            console.log("Student subject levels:", {
                              hindi: student.hindi_level,
                              math: student.math_level,
                              english: student.english_level,
                            });
                            console.log(
                              "Student knowledgeLevel:",
                              student.knowledgeLevel
                            );
                            console.log("===========================");

                            const SubjectStatusCell = ({
                              status,
                              subject,
                            }: {
                              status: {
                                completed: boolean;
                                level: number | null;
                                date: string | null;
                              };
                              subject: string;
                            }) => {
                              // If assessment is completed, show with green checkmark
                              if (status.completed && status.level) {
                                return (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      <div className="flex flex-col items-center">
                                        <Badge
                                          variant="default"
                                          className="bg-green-100 text-green-800 border-green-300 text-sm font-semibold px-3 py-1"
                                        >
                                          Level {status.level}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground mt-1 capitalize">
                                          {subject}
                                        </span>
                                      </div>
                                    </div>
                                    {status.date && (
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(
                                          status.date
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              // If level exists but no assessment completed, show level with different styling
                              if (status.level && !status.completed) {
                                return (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col items-center">
                                        <Badge
                                          variant="secondary"
                                          className="bg-blue-100 text-blue-800 border-blue-300 text-sm font-semibold px-3 py-1"
                                        >
                                          Level {status.level}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground mt-1 capitalize">
                                          {subject}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground italic">
                                      No assessment yet
                                    </span>
                                  </div>
                                );
                              }

                              // No level found at all
                              return (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <XCircle className="h-5 w-5 text-gray-400" />
                                  <span className="text-sm text-muted-foreground">
                                    Not Completed
                                  </span>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {subject}
                                  </span>
                                </div>
                              );
                            };

                            return (
                              <TableRow key={student._id}>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell>{student.roll_no}</TableCell>
                                {programs.map((program) => {
                                  const status = getStudentBaselineStatus(
                                    student._id,
                                    program.subject
                                  );
                                  console.log(
                                    `Table cell for ${student.name} - ${program.subject}:`,
                                    status
                                  );
                                  return (
                                    <TableCell
                                      key={program._id}
                                      className="text-center"
                                    >
                                      <SubjectStatusCell
                                        status={status}
                                        subject={program.subject}
                                      />
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {programs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No active programs available. Please create programs
                        first.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          {/* Assessment Info - Only show if school is selected and we have students */}
          {selectedSchool?._id && students.length > 0 && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Overview</CardTitle>
                  <CardDescription>
                    Today's assessment statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Students:</span>
                      <Badge variant="outline">{students.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Assessed Today:</span>
                      <Badge variant="default">
                        {
                          students.filter((student) =>
                            isStudentAssessedToday(student)
                          ).length
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Available:</span>
                      <Badge variant="secondary">
                        {
                          students.filter(
                            (student) => !isStudentAssessedToday(student)
                          ).length
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {modalOpen && selectedStudent && (
        <BaselineAssessmentModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          student={selectedStudent}
          programs={programs}
          onAssessmentComplete={handleAssessmentComplete}
        />
      )}
    </div>
  );
}
