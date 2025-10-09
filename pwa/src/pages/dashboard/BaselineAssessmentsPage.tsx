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
import { Plus, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function BaselineAssessmentsPage() {
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [todaysAssessments, setTodaysAssessments] = useState<Assessment[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<IProgram | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<CreateStudentDTO>>({
    name: "",
    roll_no: "",
    age: 0,
    gender: "",
    class: "",
    caste: "",
    schoolId: "",
    contactInfo: [],
    knowledgeLevel: [],
    cohort: [],
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    // Only fetch students if we have a selected school from context
    if (selectedSchool && selectedSchool._id) {
      fetchStudents();
      fetchTodaysAssessments();
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
    } catch {
      setError("Failed to fetch students");
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
    } catch {
      // Don't show error for assessments, it's not critical
      setTodaysAssessments([]);
    }
  };

  const handleCreateStudent = async () => {
    if (!selectedSchool?._id) {
      toast.error("No school selected");
      return;
    }

    if (
      !newStudent.name ||
      !newStudent.roll_no ||
      !newStudent.age ||
      !newStudent.gender ||
      !newStudent.class
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const studentData: CreateStudentDTO = {
        ...(newStudent as CreateStudentDTO),
        schoolId: selectedSchool._id,
      };

      await createStudent(studentData);
      toast.success("Student created successfully!");

      // Reset form and close dialog
      setNewStudent({
        name: "",
        roll_no: "",
        age: 0,
        gender: "",
        class: "",
        caste: "",
        schoolId: selectedSchool._id,
        contactInfo: [],
        knowledgeLevel: [],
        cohort: [],
      });
      setCreateStudentOpen(false);

      // Refresh students list
      fetchStudents();
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

  const handleAssessmentComplete = () => {
    // Refresh students data and today's assessments to get updated levels
    fetchStudents();
    fetchTodaysAssessments();
    setModalOpen(false);
    setSelectedStudent(null);
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Student</DialogTitle>
                <DialogDescription>
                  Add a new student to conduct baseline assessment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newStudent.name || ""}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, name: e.target.value })
                    }
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <Label htmlFor="roll_no">Roll Number *</Label>
                  <Input
                    id="roll_no"
                    value={newStudent.roll_no || ""}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, roll_no: e.target.value })
                    }
                    placeholder="Enter roll number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newStudent.age || ""}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          age: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={newStudent.gender || ""}
                      onValueChange={(value) =>
                        setNewStudent({ ...newStudent, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class">Class *</Label>
                    <Input
                      id="class"
                      value={newStudent.class || ""}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, class: e.target.value })
                      }
                      placeholder="e.g., 5th, 6th"
                    />
                  </div>
                  <div>
                    <Label htmlFor="caste">Caste</Label>
                    <Input
                      id="caste"
                      value={newStudent.caste || ""}
                      onChange={(e) =>
                        setNewStudent({ ...newStudent, caste: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateStudentOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStudent}>Create Student</Button>
                </div>
              </div>
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

          {/* Program Selection - Only show if school is selected */}
          {selectedSchool?._id && (
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Select Assessment Program
                  </CardTitle>
                  <CardDescription>
                    Choose the program/subject for baseline assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {programs.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">
                        No programs available
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Create a program first to conduct assessments
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Available Programs ({programs.length})</Label>
                      <Select
                        value={selectedProgram?._id || ""}
                        onValueChange={(value) => {
                          const program = programs.find((p) => p._id === value);
                          console.log("=== PROGRAM SELECTION DEBUG ===");
                          console.log("Selected program ID:", value);
                          console.log("Found program:", program);
                          console.log(
                            "Program object:",
                            JSON.stringify(program, null, 2)
                          );
                          console.log("Program _id:", program?._id);
                          console.log("================================");

                          setSelectedProgram(program || null);
                          // Clear student selection when program changes
                          setSelectedStudent(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select a program --" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program._id} value={program._id}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {program.name} ({program.subject})
                                </span>
                                <Badge variant="secondary" className="ml-2">
                                  {program.totalLevels} levels
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedProgram && (
                    <div className="p-3 border rounded-lg bg-green-50 border-green-200 mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm text-green-800">
                          Selected Program
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {selectedProgram.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {selectedProgram.subject}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Levels: {selectedProgram.totalLevels}</span>
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student Selection - Only show if program is selected */}
          {selectedProgram && selectedSchool?._id && (
            <div className="lg:col-span-2">
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

          {/* Assessment Info - Only show if program and school are selected */}
          {selectedProgram && selectedSchool?._id && (
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

      {modalOpen && selectedStudent && selectedProgram && (
        <BaselineAssessmentModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          student={selectedStudent}
          program={selectedProgram}
          onAssessmentComplete={handleAssessmentComplete}
          oscillationTolerance={0.5}
          minQuestionsBeforeOscillationStop={3}
          maxQuestionsPerLevel={2}
        />
      )}
    </div>
  );
}
