import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
  type Student,
  type CreateStudentDTO,
  type UpdateStudentDTO,
} from "@/services/students";
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
import { Plus, Loader2, Trash2, Edit } from "lucide-react";
import { BaselineAssessmentModal } from "@/components/BaselineAssessment";

function ManageStudents() {
  const { selectedSchool } = useSchoolContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<CreateStudentDTO>({
    roll_no: "",
    name: "",
    age: 0,
    gender: "",
    caste: "",
    class: "",
    schoolId: selectedSchool?._id || "",
    contactInfo: [],
    knowledgeLevel: [],
    cohort: [],
  });

  const queryClient = useQueryClient();

  // Fetch students filtered by selected school
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students", selectedSchool?._id],
    queryFn: () => getStudents(selectedSchool?._id),
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

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsDeleteDialogOpen(false);
      toast.success("Student deleted successfully");
    },
    onError: (error: any) => {
      // Extract the error message from the server response
      let errorMessage = "Failed to delete student";

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
        roll_no,
        name,
        age,
        gender,
        class: className,
        caste,
        schoolId,
      } = formData;
      updateMutation.mutate({
        id: editingStudent._id,
        data: { roll_no, name, age, gender, class: className, caste, schoolId },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      roll_no: student.roll_no,
      name: student.name,
      age: student.age,
      gender: student.gender,
      caste: student.caste,
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
      roll_no: "",
      name: "",
      age: 0,
      gender: "",
      caste: "",
      class: "",
      schoolId: selectedSchool?._id || "",
      contactInfo: [],
      knowledgeLevel: [],
      cohort: [],
    });
  };

  const handleDelete = async () => {
    if (!deletingStudent?._id) return;
    await deleteMutation.mutateAsync(deletingStudent._id);
  };

  const getCurrentLevel = (student: Student): number => {
    if (!student.knowledgeLevel || student.knowledgeLevel.length === 0) {
      return 0;
    }
    return student.knowledgeLevel[student.knowledgeLevel.length - 1].level;
  };

  if (isLoadingStudents) {
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Students</h1>
          <p className="text-muted-foreground">
            Create and manage students for your schools
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="rounded-md border overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aadhar Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Caste</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Level & Assessments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students?.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.roll_no}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.age}</TableCell>
                <TableCell>{student.gender}</TableCell>
                <TableCell>{student.caste || "N/A"}</TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge
                      variant={
                        getCurrentLevel(student) > 0 ? "default" : "secondary"
                      }
                    >
                      Level {getCurrentLevel(student)}
                    </Badge>
                    {student.knowledgeLevel?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {student.knowledgeLevel.length} assessments
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartAssessment(student)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                    >
                      <Target className="h-4 w-4 mr-1" />
                      Assess
                    </Button> */}
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
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
              <Label htmlFor="roll_no">Aadhar Number</Label>
              <Input
                id="roll_no"
                value={formData.roll_no}
                placeholder="Enter student aadhar number"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, roll_no: e.target.value }))
                }
                disabled={!!editingStudent}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caste">Caste</Label>
                <Select
                  value={formData.caste}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, caste: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select caste" />
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
                value={formData.class}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, class: e.target.value }))
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
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student "{deletingStudent?.name}" and remove them from any
              associated cohorts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
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
