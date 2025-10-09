"use client";

import { useState, useEffect } from "react";
import {
  getAssessmentQuestionSets,
  AssessmentQuestionSet,
} from "@/services/assessmentQuestionSets";
import { Button } from "@/components/ui/button";
import { BaselineAssessmentModal } from "@/components/BaselineAssessment";
import {
  getStudents,
  Student,
  createStudent,
  CreateStudentDTO,
} from "@/services/students";
import { getAssessments, Assessment } from "@/services/assessments";
import { useAuth } from "@/hooks/useAuth";
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
import { Plus, Users, Clock } from "lucide-react";
import { toast } from "sonner";

export default function BaselineAssessmentsPage() {
  const { user } = useAuth();
  const [questionSets, setQuestionSets] = useState<AssessmentQuestionSet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [todaysAssessments, setTodaysAssessments] = useState<Assessment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
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
    schoolId: user?.schoolId?._id || "",
    contactInfo: [],
    knowledgeLevel: [],
    cohort: [],
  });

  useEffect(() => {
    fetchQuestionSets();
    fetchStudents();
    fetchTodaysAssessments();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, todaysAssessments]);

  const fetchQuestionSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssessmentQuestionSets();
      setQuestionSets(data);
    } catch {
      setError("Failed to fetch question sets");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await getStudents(user?.schoolId?._id);
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

  const filterStudents = () => {
    const assessedStudentIds = new Set(
      todaysAssessments.map((assessment) => assessment.student)
    );

    const availableStudents = students.filter(
      (student) => !assessedStudentIds.has(student._id)
    );

    setFilteredStudents(availableStudents);
  };

  const handleCreateStudent = async () => {
    if (!user?.schoolId?._id) {
      toast.error("School information not found");
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
        schoolId: user.schoolId._id,
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
        schoolId: user.schoolId._id,
        contactInfo: [],
        knowledgeLevel: [],
        cohort: [],
      });
      setCreateStudentOpen(false);

      // Refresh students list
      fetchStudents();
    } catch (error) {
      toast.error("Failed to create student");
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
                      placeholder="Optional"
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

        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Selection */}
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
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No students available
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      {students.length === 0
                        ? "Create your first student to start assessments"
                        : "All students have been assessed today"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>
                      Available Students ({filteredStudents.length})
                    </Label>
                    <Select
                      value={selectedStudent?._id || ""}
                      onValueChange={(value) => {
                        const student = filteredStudents.find(
                          (s) => s._id === value
                        );
                        setSelectedStudent(student || null);
                        if (student) setModalOpen(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Select a student to assess --" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStudents.map((student) => {
                          const latestLevel =
                            student.knowledgeLevel &&
                            student.knowledgeLevel.length > 0
                              ? student.knowledgeLevel[
                                  student.knowledgeLevel.length - 1
                                ].level
                              : null;

                          return (
                            <SelectItem key={student._id} value={student._id}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {student.name} (Roll: {student.roll_no})
                                </span>
                                {latestLevel && (
                                  <Badge variant="secondary" className="ml-2">
                                    Level {latestLevel}
                                  </Badge>
                                )}
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
                                      selectedStudent.knowledgeLevel.length - 1
                                    ].level
                                  }
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Last Assessment:</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    selectedStudent.knowledgeLevel[
                                      selectedStudent.knowledgeLevel.length - 1
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

          {/* Assessment Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Assessment Overview</CardTitle>
                <CardDescription>Today's assessment statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Students:</span>
                    <Badge variant="outline">{students.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assessed Today:</span>
                    <Badge variant="default">{todaysAssessments.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Available:</span>
                    <Badge variant="secondary">{filteredStudents.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Sets Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assessment Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questionSets.map((set) => (
                    <div
                      key={set._id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">{set.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          v{set.version} • {set.levels.length} levels
                        </p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {modalOpen && selectedStudent && (
        <BaselineAssessmentModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          student={selectedStudent}
          onAssessmentComplete={handleAssessmentComplete}
          oscillationTolerance={0.5}
          minQuestionsBeforeOscillationStop={3}
          maxQuestionsPerLevel={2}
        />
      )}
    </div>
  );
}
