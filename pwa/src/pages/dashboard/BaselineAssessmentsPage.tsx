"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
import { getSchool } from "@/services/schools";
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
  BookOpen,
  Loader2,
  XCircle,
  Search,
  Play,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function BaselineAssessmentsPage() {
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [todaysAssessments, setTodaysAssessments] = useState<Assessment[]>([]);
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<
    string | undefined
  >(undefined);
  const [error, setError] = useState<string | null>(null);
  const [testPromotionType, setTestPromotionType] = useState<"automatic" | "manual">("automatic");
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
    apaarId: "",
    schoolId: "",
    contactInfo: [],
    knowledgeLevel: [],
    cohort: [],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Only fetch students if we have a selected school from context
    if (selectedSchool && selectedSchool._id) {
      fetchPrograms(selectedSchool._id);
      fetchStudents();
      fetchTodaysAssessments();
      if (selectedSchool._id) {
        fetchAllAssessments(selectedSchool._id);
      }
      // Fetch full school data for testPromotionType
      if (selectedSchool.testPromotionType) {
        setTestPromotionType(selectedSchool.testPromotionType);
      } else {
        getSchool(selectedSchool._id).then((school) => {
          setTestPromotionType(school.testPromotionType || "automatic");
        }).catch(() => {
          setTestPromotionType("automatic");
        });
      }
    } else if (user && !isSuperAdmin(user)) {
      // Avoid showing all programs during initial refresh while school context is still loading.
      setPrograms([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchool, user]);

  // Function to check if a student was assessed today
  const isStudentAssessedToday = (student: Student) => {
    // Check by todaysAssessments first
    const assessedInTodaysAssessments = todaysAssessments.some((assessment) => {
      const assessmentStudentId =
        typeof assessment.student === "string"
          ? assessment.student
          : (assessment.student as { _id?: string })?._id || assessment.student;
      return assessmentStudentId === student._id;
    });

    if (assessedInTodaysAssessments) return true;

    // Also check by knowledgeLevel with today's date
    if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check new structure first
      const hasNewStructure = student.knowledgeLevel.some(
        (kl) => kl && "program" in kl && "subject" in kl && kl.date
      );

      if (hasNewStructure) {
        // Check if any assessment was done today (new structure)
        return student.knowledgeLevel.some((kl) => {
          if (kl && kl.date) {
            const assessmentDate = new Date(kl.date);
            return assessmentDate >= today && assessmentDate < tomorrow;
          }
          return false;
        });
      } else {
        // Old structure - check latest assessment
        const latestAssessment =
          student.knowledgeLevel[student.knowledgeLevel.length - 1];
        if (latestAssessment && latestAssessment.date) {
          const assessmentDate = new Date(latestAssessment.date);
          return assessmentDate >= today && assessmentDate < tomorrow;
        }
      }
    }

    return false;
  };

  const fetchPrograms = async (schoolId?: string) => {
    // For non-super-admin users, do not fetch without an explicit school.
    if (user && !isSuperAdmin(user) && !schoolId) {
      setPrograms([]);
      return;
    }

    try {
      const response = await programsService.getPrograms({
        isActive: "true",
        schoolId,
      });
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
      // Handle both string and object school references
      const schoolAssessments = assessments.filter((assessment) => {
        const assessmentSchoolId =
          typeof assessment.school === "string"
            ? assessment.school
            : (assessment.school as { _id?: string })?._id || assessment.school;
        return assessmentSchoolId === schoolId;
      });
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
        apaarId: "",
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
    } catch (error: unknown) {
      // Extract the error message from the server response
      let errorMessage = "Failed to create student";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      } else if (error instanceof Error) {
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
    setSelectedStudent(null);
    setSelectedProgramId(undefined);
  };

  const handleAssessNow = (student: Student, programId: string) => {
    setSelectedStudent(student);
    setSelectedProgramId(programId);
    setModalOpen(true);
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

  // Helper function to check if student was assessed today for a specific program
  // const isStudentAssessedTodayForProgram = (student: Student, programId: string) => {
  //   if (!student.knowledgeLevel || student.knowledgeLevel.length === 0) {
  //     return false;
  //   }

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const tomorrow = new Date(today);
  //   tomorrow.setDate(tomorrow.getDate() + 1);

  //   // Check if student has knowledgeLevel entry for this program assessed today
  //   return student.knowledgeLevel.some((kl) => {
  //     if (kl.program && kl.program.toString() === programId) {
  //       const assessmentDate = new Date(kl.date);
  //       return assessmentDate >= today && assessmentDate < tomorrow;
  //     }
  //     return false;
  //   });
  // };

  // Helper function to get baseline completion status for a student by program
  const getStudentBaselineStatus = (studentId: string, programId: string) => {
    // Find the student object
    const student = students.find((s) => s._id === studentId);

    if (!student) {
      return {
        completed: false,
        level: null,
        date: null,
        assessedToday: false,
      };
    }

    // Priority 1: Check for new data structure (with program, subject)
    if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
      // Check if student has new structure
      const hasNewStructure = student.knowledgeLevel.some(
        (kl) =>
          kl && "program" in kl && "subject" in kl && kl.program && kl.subject
      );

      if (hasNewStructure) {
        // Use new structure - find knowledgeLevel entry for this specific program
        const programKnowledgeLevels = student.knowledgeLevel.filter(
          (kl) =>
            kl &&
            "program" in kl &&
            kl.program &&
            String(kl.program) === programId
        );

        if (programKnowledgeLevels.length > 0) {
          // Get the most recent assessment for this program
          const latestAssessment = programKnowledgeLevels.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          // Check if assessed today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const assessmentDate = new Date(latestAssessment.date);
          const assessedToday =
            assessmentDate >= today && assessmentDate < tomorrow;

          return {
            completed: true,
            level: latestAssessment.level,
            date: latestAssessment.date,
            assessedToday,
          };
        }
      }
    }

    // Priority 2: Fallback to old structure - use Assessment model
    // Check if student has old knowledgeLevel structure (just level and date, no program/subject)
    const hasOldStructure =
      student.knowledgeLevel &&
      student.knowledgeLevel.some(
        (kl) =>
          kl &&
          "level" in kl &&
          "date" in kl &&
          !("program" in kl) &&
          !("subject" in kl)
      );

    if (hasOldStructure) {
      // Find the program to get its subject
      const program = programs.find((p) => p._id === programId);
      if (!program) {
        return {
          completed: false,
          level: null,
          date: null,
          assessedToday: false,
        };
      }

      // Fetch assessments for this student and program subject from Assessment model
      const studentAssessments = allAssessments.filter((assessment) => {
        const assessmentStudentId =
          typeof assessment.student === "string"
            ? assessment.student
            : (assessment.student as { _id?: string })?._id ||
              assessment.student;
        return (
          assessmentStudentId === student._id &&
          assessment.subject.toLowerCase() === program.subject.toLowerCase()
        );
      });

      if (studentAssessments.length > 0) {
        // Get the most recent assessment
        const latestAssessment = studentAssessments.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        // Check if assessed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const assessmentDate = new Date(latestAssessment.date);
        const assessedToday =
          assessmentDate >= today && assessmentDate < tomorrow;

        return {
          completed: true,
          level: latestAssessment.level,
          date: latestAssessment.date,
          assessedToday,
        };
      }
    }

    return { completed: false, level: null, date: null, assessedToday: false };
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Baseline Tests</h1>
          </div>
          <Dialog open={createStudentOpen} onOpenChange={setCreateStudentOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Student</DialogTitle>
                <DialogDescription>
                  Add a new student to conduct baseline test
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                {/* Personal Information Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base sm:text-sm">Name</Label>
                      <Input
                        id="name"
                        value={newStudent.name || ""}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, name: e.target.value })
                        }
                        className="h-12 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber" className="text-base sm:text-sm">Mobile Number (Optional)</Label>
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
                        className="h-12 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="age" className="text-base sm:text-sm">
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
                        className="w-full h-12 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="gender" className="text-base sm:text-sm">
                        Gender
                      </Label>
                      <Select
                        value={newStudent.gender || ""}
                        onValueChange={(value) =>
                          setNewStudent({ ...newStudent, gender: value })
                        }
                      >
                        <SelectTrigger className="w-full min-w-0 h-12 sm:h-10 text-base sm:text-sm">
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
                      <Label htmlFor="caste" className="text-base sm:text-sm">
                        Category (Optional)
                      </Label>
                      <Select
                        value={newStudent.caste || ""}
                        onValueChange={(value) =>
                          setNewStudent({ ...newStudent, caste: value })
                        }
                      >
                        <SelectTrigger className="w-full min-w-0 h-12 sm:h-10 text-base sm:text-sm">
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
                </div>

                {/* Identification Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Identification
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadharNumber" className="text-base sm:text-sm">Aadhar Number (Optional)</Label>
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
                        className="h-12 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apaarId" className="text-base sm:text-sm">APAAR ID (Optional)</Label>
                      <Input
                        id="apaarId"
                        value={newStudent.apaarId || ""}
                        placeholder="Enter student APAAR ID"
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            apaarId: e.target.value,
                          })
                        }
                        className="h-12 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Details Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                    Academic Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class" className="text-base sm:text-sm">Class</Label>
                      <Select
                        value={newStudent.class || ""}
                        onValueChange={(value) =>
                          setNewStudent({ ...newStudent, class: value })
                        }
                      >
                        <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              Class {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base sm:text-sm">School</Label>
                      <div className="p-3 border rounded-md bg-muted/50 h-12 sm:h-10 flex items-center">
                        <span className="font-medium text-sm truncate">
                          {selectedSchool?.name || "No school selected"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateStudentOpen(false)}
                  className="h-12 sm:h-10 text-base sm:text-sm"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateStudent} disabled={isCreating} className="h-12 sm:h-10 text-base sm:text-sm">
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
                    Choose the school to manage tests for
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
          {/* Baseline Completion Table - Show all students with their program-wise baseline status */}
          {selectedSchool?._id &&
            students.length > 0 &&
            programs.length > 0 && (
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Baseline Test Status
                        </CardTitle>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, roll..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    <div className="overflow-x-auto">
                      {(() => {
                        // Filter programs: only show columns where at least one student has completed baseline
                        const visiblePrograms = programs.filter((program) =>
                          students.some((student) => getStudentBaselineStatus(student._id, program._id).completed)
                        );
                        return (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="font-semibold text-foreground text-sm sm:text-base py-3 sm:py-4 pl-4 sm:pl-6">
                              Student
                            </TableHead>
                            {visiblePrograms.map((program) => (
                              <TableHead
                                key={program._id}
                                className="text-center font-semibold text-foreground text-sm sm:text-base py-3 sm:py-4 min-w-[100px]"
                              >
                                <span className="capitalize">
                                  {program.name}
                                </span>
                              </TableHead>
                            ))}
                            <TableHead className="text-center font-semibold text-foreground text-sm sm:text-base py-3 sm:py-4 pr-4 sm:pr-6 w-[80px]">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filteredStudents = students.filter((student) => {
                              if (!searchQuery.trim()) return true;
                              const query = searchQuery.toLowerCase().trim();
                              const name = student.name?.toLowerCase() || "";
                              const rollNo = student.roll_no?.toLowerCase() || "";
                              const className = student.class?.toLowerCase() || "";
                              return (
                                name.includes(query) ||
                                rollNo.includes(query) ||
                                className.includes(query)
                              );
                            });

                            if (filteredStudents.length === 0) {
                              return (
                                <TableRow>
                                  <TableCell
                                    colSpan={2 + visiblePrograms.length}
                                    className="text-center py-8 text-muted-foreground"
                                  >
                                    {searchQuery.trim()
                                      ? `No students found matching "${searchQuery}"`
                                      : "No students found"}
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return filteredStudents.map((student) => {
                              // Get all statuses for this student
                              const programStatuses = visiblePrograms.map((program) => ({
                                program,
                                status: getStudentBaselineStatus(student._id, program._id),
                              }));
                              // Pending programs should check ALL programs, not just visible ones
                              const allProgramStatuses = programs.map((program) => ({
                                program,
                                status: getStudentBaselineStatus(student._id, program._id),
                              }));
                              const pendingPrograms = allProgramStatuses.filter((ps) => !ps.status.completed);
                              const allDone = pendingPrograms.length === 0;

                              return (
                                <TableRow key={student._id} className="hover:bg-muted/20 transition-colors">
                                  <TableCell className="py-3 sm:py-4 pl-4 sm:pl-6">
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/reports/student/${student._id}`)}
                                      className="text-primary hover:underline cursor-pointer text-left font-medium text-sm sm:text-base"
                                    >
                                      {student.name}
                                    </button>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                      Class {student.class}
                                    </p>
                                  </TableCell>
                                  {programStatuses.map(({ program, status }) => (
                                    <TableCell
                                      key={program._id}
                                      className={`text-center py-3 sm:py-4 ${
                                        status.assessedToday ? "bg-green-50/60" : ""
                                      }`}
                                    >
                                      {status.completed && status.level ? (
                                        <div className="flex flex-col items-center gap-1">
                                          <Badge
                                            className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 ${
                                              status.assessedToday
                                                ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100"
                                                : "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100"
                                            }`}
                                          >
                                            L{status.level}
                                          </Badge>
                                          {status.assessedToday && (
                                            <span className="text-[10px] sm:text-xs font-medium text-green-600">
                                              Today
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mx-auto" />
                                      )}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-center py-3 sm:py-4 pr-4 sm:pr-6">
                                    {allDone ? (
                                      <CheckCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto" />
                                    ) : (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm rounded-lg border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                                          >
                                            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                            Test
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          {pendingPrograms.map(({ program }) => (
                                            <DropdownMenuItem
                                              key={program._id}
                                              onClick={() => handleAssessNow(student, program._id)}
                                              className="cursor-pointer py-2.5 text-sm"
                                            >
                                              <Play className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0" />
                                              <div className="flex flex-col">
                                                <span className="font-medium">{program.name}</span>
                                                <span className="text-xs text-muted-foreground">{program.subject}</span>
                                              </div>
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })()}
                        </TableBody>
                      </Table>
                        );
                      })()}
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
                  <CardTitle>Test Overview</CardTitle>
                  <CardDescription>
                    Today's test statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Students:</span>
                      <Badge variant="outline">{students.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tested Today:</span>
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
          preSelectedProgramId={selectedProgramId}
          testPromotionType={testPromotionType}
          onAssessmentComplete={handleAssessmentComplete}
        />
      )}
    </div>
  );
}
