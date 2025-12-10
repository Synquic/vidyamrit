import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  deleteStudent,
  getStudents,
  getArchivedStudents,
  restoreStudent,
  updateStudent,
  type Student,
  type CreateStudentDTO,
  type UpdateStudentDTO,
} from "@/services/students";
import { getAssessments, type Assessment } from "@/services/assessments";
import { programsService } from "@/services/programs";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Loader2, Edit, Archive, RotateCcw, Search } from "lucide-react";
import { BaselineAssessmentModal } from "@/components/BaselineAssessment";

function ManageStudents() {
  const { selectedSchool } = useSchoolContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");
  const [confirmArchiveText, setConfirmArchiveText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CreateStudentDTO>({
    name: "",
    age: 0,
    gender: "",
    caste: "",
    mobileNumber: "",
    aadharNumber: "",
    class: "",
    schoolId: selectedSchool?._id || "",
    contactInfo: [],
    knowledgeLevel: [],
    cohort: [],
  });

  const queryClient = useQueryClient();

  // Fetch active students filtered by selected school
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students", selectedSchool?._id],
    queryFn: () => getStudents(selectedSchool?._id),
    enabled: !!selectedSchool?._id && viewMode === "active",
  });

  // Fetch archived students filtered by selected school
  const { data: archivedStudents, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["archivedStudents", selectedSchool?._id],
    queryFn: () => getArchivedStudents(selectedSchool?._id),
    enabled: !!selectedSchool?._id && viewMode === "archived",
  });

  // Fetch programs
  const { data: programsResponse } = useQuery({
    queryKey: ["programs"],
    queryFn: () => programsService.getPrograms({ isActive: "true" }),
  });

  const programs = programsResponse?.programs || [];

  // Fetch all assessments for fallback to old data structure
  const { data: allAssessments = [] } = useQuery({
    queryKey: ["allAssessments", selectedSchool?._id],
    queryFn: async () => {
      try {
        const assessments = await getAssessments();
        // Filter by school if selectedSchool is available
        if (selectedSchool?._id) {
          return assessments.filter((assessment) => {
            const schoolId = typeof assessment.school === "string" 
              ? assessment.school 
              : (assessment.school as { _id?: string })?._id || assessment.school;
            return schoolId === selectedSchool._id;
          });
        }
        return assessments;
      } catch {
        return [];
      }
    },
    enabled: !!selectedSchool?._id,
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStudentDTO) => createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      handleCloseDialog();
      toast.success("Student created successfully");
    },
    onError: (error: any) => {
      // Extract the error message from the server response
      let errorMessage = "Failed to create student";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDTO }) =>
      updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      handleCloseDialog();
      toast.success("Student updated successfully");
    },
    onError: (error: any) => {
      // Extract the error message from the server response
      let errorMessage = "Failed to update student";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  // Archive student mutation
  const archiveMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["archivedStudents"] });
      setIsDeleteDialogOpen(false);
      toast.success("Student archived successfully");
    },
    onError: (error: any) => {
      // Extract the error message from the server response
      let errorMessage = "Failed to archive student";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  // Restore student mutation
  const restoreMutation = useMutation({
    mutationFn: restoreStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["archivedStudents"] });
      toast.success("Student restored successfully");
    },
    onError: (error: any) => {
      let errorMessage = "Failed to restore student";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });

  const handleSubmit = () => {
    if (!selectedSchool?._id) {
      toast.error("No school selected. Please select a school first.");
      return;
    }

    if (editingStudent) {
      const {
        name,
        age,
        gender,
        class: className,
        caste,
        mobileNumber,
        aadharNumber,
        schoolId,
      } = formData;
      updateMutation.mutate({
        id: editingStudent._id,
        data: {
          name,
          age,
          gender,
          class: className,
          caste,
          mobileNumber,
          aadharNumber,
          schoolId,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      age: student.age,
      gender: student.gender,
      caste: student.caste || "",
      mobileNumber: student.mobileNumber || "",
      aadharNumber: student.aadharNumber || "",
      class: student.class,
      schoolId: student.schoolId._id,
      contactInfo: student.contactInfo || [],
      knowledgeLevel: student.knowledgeLevel || [],
      cohort: student.cohort || [],
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingStudent(null);
    setFormData({
      name: "",
      age: 0,
      gender: "",
      caste: "",
      mobileNumber: "",
      aadharNumber: "",
      class: "",
      schoolId: selectedSchool?._id || "",
      contactInfo: [],
      knowledgeLevel: [],
      cohort: [],
    });
  };

  const handleArchive = async () => {
    if (!deletingStudent?._id) return;
    if (confirmArchiveText !== deletingStudent.name) {
      toast.error("Confirmation text does not match student name");
      return;
    }
    await archiveMutation.mutateAsync(deletingStudent._id);
    setConfirmArchiveText("");
  };

  const handleRestore = async (student: Student) => {
    await restoreMutation.mutateAsync(student._id);
  };

  // Helper function to get student level info for all programs (similar to StudentLevelsReport)
  interface StudentLevelInfo {
    subject: string;
    programName: string;
    level: number;
    date: string;
    programId: string;
  }

  const getStudentLevelInfo = (student: Student): StudentLevelInfo[] => {
    const subjectLevels: Record<string, StudentLevelInfo> = {};

    // Priority 1: Check new data structure (knowledgeLevel with program and subject)
    if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
      let hasNewStructure = false;

      student.knowledgeLevel.forEach((kl: any) => {
        if (kl && kl.program && kl.subject && kl.level && kl.date) {
          hasNewStructure = true;
          const subject = kl.subject;
          const programId = typeof kl.program === "string" ? kl.program : kl.program.toString();
          
          // Only keep the latest assessment per subject
          if (!subjectLevels[subject] || new Date(kl.date) > new Date(subjectLevels[subject].date)) {
            subjectLevels[subject] = {
              subject: subject,
              programName: kl.programName || subject,
              level: typeof kl.level === "number" ? kl.level : parseInt(kl.level) || 0,
              date: typeof kl.date === "string" ? kl.date : new Date(kl.date).toISOString(),
              programId: programId,
            };
          }
        }
      });

      // If we found new structure data, return it
      if (hasNewStructure) {
        return Object.values(subjectLevels).sort((a, b) => 
          a.subject.localeCompare(b.subject)
        );
      }
    }

    // Priority 2: Fallback to old structure - use Assessment model
    // Check if student has old knowledgeLevel structure (just level and date)
    const hasOldStructure = student.knowledgeLevel && student.knowledgeLevel.some(
      (kl: any) => kl && kl.level && kl.date && !kl.program && !kl.subject
    );

    if (hasOldStructure) {
      // Fetch assessments for this student from Assessment model
      const studentAssessments = allAssessments.filter(
        (assessment) => {
          const assessmentStudentId = typeof assessment.student === "string"
            ? assessment.student
            : (assessment.student as { _id?: string })?._id || assessment.student;
          return assessmentStudentId === student._id;
        }
      );

      // Group assessments by subject and get latest level per subject
      const assessmentBySubject: Record<string, Assessment> = {};
      studentAssessments.forEach((assessment) => {
        const subject = assessment.subject;
        if (
          !assessmentBySubject[subject] ||
          new Date(assessment.date) > new Date(assessmentBySubject[subject].date)
        ) {
          assessmentBySubject[subject] = assessment;
        }
      });

      // Convert to StudentLevelInfo format
      Object.values(assessmentBySubject).forEach((assessment) => {
        const subject = assessment.subject;
        // Find the program for this subject
        const program = programs.find((p) => p.subject.toLowerCase() === subject.toLowerCase());
        
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

  // Filter students based on search query
  const filterStudents = (studentList: Student[] | undefined) => {
    if (!studentList) return [];
    if (!searchQuery.trim()) return studentList;
    
    const query = searchQuery.toLowerCase().trim();
    return studentList.filter((student) => {
      const name = student.name?.toLowerCase() || "";
      const rollNo = student.roll_no?.toLowerCase() || "";
      const className = student.class?.toLowerCase() || "";
      const gender = student.gender?.toLowerCase() || "";
      const caste = student.caste?.toLowerCase() || "";
      
      return (
        name.includes(query) ||
        rollNo.includes(query) ||
        className.includes(query) ||
        gender.includes(query) ||
        caste.includes(query)
      );
    });
  };

  const filteredActiveStudents = filterStudents(students);
  const filteredArchivedStudents = filterStudents(archivedStudents);

  const isLoading =
    viewMode === "active" ? isLoadingStudents : isLoadingArchived;

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedSchool) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 mb-4 text-muted-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No School Selected</h3>
          <p className="text-muted-foreground mb-4">
            Please select a school from the sidebar to manage students.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Manage Students</h1>
            <p className="text-muted-foreground">
              Create and manage students for your schools
            </p>
          </div>
          {viewMode === "active" && (
            <Button
              onClick={() => setIsOpen(true)}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "active" ? "default" : "ghost"}
              onClick={() => setViewMode("active")}
              className="rounded-r-none"
            >
              Active Students
            </Button>
            <Button
              variant={viewMode === "archived" ? "default" : "ghost"}
              onClick={() => setViewMode("archived")}
              className="rounded-l-none"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, roll, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Level & Assessments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewMode === "active"
              ? // Active students
                filteredActiveStudents.map((student, index) => (
                  <TableRow key={student._id}>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.age}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.caste || "N/A"}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {(() => {
                          const levelInfo = getStudentLevelInfo(student);
                          if (levelInfo.length === 0) {
                            return (
                              <div className="space-y-1">
                                <Badge variant="secondary">Not Assessed</Badge>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-1">
                              {levelInfo.map((info, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant="default" className="text-xs">
                                    {info.subject}: L{info.level}
                                  </Badge>
                                </div>
                              ))}
                              <div className="text-xs text-muted-foreground">
                                {levelInfo.length} program{levelInfo.length > 1 ? "s" : ""} assessed
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingStudent(student);
                            setConfirmArchiveText("");
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : // Archived students
                filteredArchivedStudents.map((student, index) => (
                  <TableRow key={student._id}>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.age}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.caste || "N/A"}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {(() => {
                          const levelInfo = getStudentLevelInfo(student);
                          if (levelInfo.length === 0) {
                            return (
                              <div className="space-y-1">
                                <Badge variant="secondary">Not Assessed</Badge>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-1">
                              {levelInfo.map((info, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Badge variant="default" className="text-xs">
                                    {info.subject}: L{info.level}
                                  </Badge>
                                </div>
                              ))}
                              <div className="text-xs text-muted-foreground">
                                {levelInfo.length} program{levelInfo.length > 1 ? "s" : ""} assessed
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(student)}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {((viewMode === "active" && filteredActiveStudents.length === 0) ||
              (viewMode === "archived" && filteredArchivedStudents.length === 0)) && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchQuery.trim()
                    ? `No students found matching "${searchQuery}"`
                    : viewMode === "active"
                    ? "No active students found"
                    : "No archived students found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student" : "Create Student"}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Update the student's information below"
                : "Fill in the details to create a new student"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadharNumber">Aadhar Number (Optional)</Label>
              <Input
                id="aadharNumber"
                value={formData.aadharNumber || ""}
                placeholder="Enter student aadhar number"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    aadharNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
              <Input
                id="mobileNumber"
                value={formData.mobileNumber || ""}
                placeholder="Enter student mobile number"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mobileNumber: e.target.value,
                  }))
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
                  value={formData.age}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      age: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="gender" className="text-xs">
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
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
                  value={formData.caste || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, caste: value }))
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
              <Select
                value={formData.class}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, class: value }))
                }
              >
                <SelectTrigger>
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
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingStudent ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setConfirmArchiveText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the student "{deletingStudent?.name}". They will
              be moved to the archived section and can be restored later. The
              student will be removed from active view but their data will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-archive" className="text-sm font-medium">
              Type the student's name to confirm:{" "}
              <span className="font-semibold">"{deletingStudent?.name}"</span>
            </Label>
            <Input
              id="confirm-archive"
              value={confirmArchiveText}
              onChange={(e) => setConfirmArchiveText(e.target.value)}
              placeholder="Enter student name"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmArchiveText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={
                archiveMutation.isPending ||
                confirmArchiveText !== deletingStudent?.name
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {archiveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Baseline Assessment Modal */}
      <BaselineAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => {
          setIsAssessmentOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onAssessmentComplete={() => {
          // Refresh students data to show updated levels
          queryClient.invalidateQueries({ queryKey: ["students"] });
          setIsAssessmentOpen(false);
          setSelectedStudent(null);
          toast.success("Assessment completed and student level updated!");
        }}
      />
    </div>
  );
}

export default ManageStudents;
