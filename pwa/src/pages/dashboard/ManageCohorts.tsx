import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCohort,
  deleteCohort,
  getCohorts,
  updateCohort,
  generateOptimalCohorts,
  type Cohort,
  type CreateCohortDTO,
  type UpdateCohortDTO,
} from "@/services/cohorts";
import { getSchools } from "@/services/schools";
import { getTutors } from "@/services/tutors";
import { getStudents, getStudentCohortStatus } from "@/services/students";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  Users,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";

function ManageCohorts() {
  const { selectedSchool } = useSchoolContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [deletingCohort, setDeletingCohort] = useState<Cohort | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [formData, setFormData] = useState<CreateCohortDTO>({
    name: "",
    schoolId: "",
    tutorId: "",
    students: [],
  });

  const queryClient = useQueryClient();

  // Fetch cohorts filtered by selected school
  const { data: cohorts, isLoading: isLoadingCohorts } = useQuery({
    queryKey: ["cohorts", selectedSchool?._id],
    queryFn: () => getCohorts(selectedSchool?._id),
    enabled: !!selectedSchool?._id,
  });

  // Fetch all schools, tutors, students for dropdowns
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  const { data: allTutors = [] } = useQuery({
    queryKey: ["tutors"],
    queryFn: () => getTutors(),
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  });

  // Fetch student cohort status for the selected school
  const { data: cohortStatus } = useQuery({
    queryKey: ["student-cohort-status", selectedSchool?._id],
    queryFn: () =>
      selectedSchool?._id
        ? getStudentCohortStatus(selectedSchool._id)
        : Promise.resolve(undefined),
    enabled: !!selectedSchool?._id,
  });

  // Fetch programs for cohort generation
  const { data: programsResponse } = useQuery({
    queryKey: ["programs"],
    queryFn: () => programsService.getPrograms({ isActive: "true" }),
  });

  const programs = programsResponse?.programs || [];

  // Filter students and tutors based on selected school
  const filteredTutors = allTutors.filter(
    (tutor) => !formData.schoolId || tutor.schoolId?._id === formData.schoolId
  );

  const filteredStudents = allStudents.filter(
    (student) =>
      !formData.schoolId || student.schoolId?._id === formData.schoolId
  );

  // Filter cohorts to show only those from the selected school (additional safety filter)
  const filteredCohorts =
    cohorts?.filter((cohort) => {
      const cohortSchoolId =
        typeof cohort.schoolId === "string"
          ? cohort.schoolId
          : cohort.schoolId?._id;
      return cohortSchoolId === selectedSchool?._id;
    }) || [];

  // Create cohort mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCohortDTO) => createCohort(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      handleCloseDialog();
      toast.success("Cohort created successfully");
    },
    onError: () => {
      toast.error("Failed to create cohort");
    },
  });

  // Update cohort mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCohortDTO }) =>
      updateCohort(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      handleCloseDialog();
      toast.success("Cohort updated successfully");
    },
    onError: () => {
      toast.error("Failed to update cohort");
    },
  });

  // Delete cohort mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCohort,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      setIsDeleteDialogOpen(false);
      toast.success("Cohort deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete cohort");
    },
  });

  // Generate optimal cohorts mutation
  const generateCohortsMutation = useMutation({
    mutationFn: generateOptimalCohorts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["student-cohort-status"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsGenerating(false);
      toast.success(
        `Successfully generated ${data.cohorts.length} optimal cohorts for ${data.studentsAssigned} students!`
      );
    },
    onError: (error: any) => {
      let errorMessage = "Failed to generate cohorts";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setIsGenerating(false);
      toast.error(errorMessage);
    },
  });

  const handleSubmit = () => {
    if (editingCohort) {
      const { name, tutorId, students } = formData;
      updateMutation.mutate({
        id: editingCohort._id,
        data: { name, tutorId, students },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setFormData({
      name: cohort.name,
      schoolId: cohort.schoolId._id,
      tutorId: cohort.tutorId._id,
      students: cohort.students,
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingCohort(null);
    setFormData({
      name: "",
      schoolId: "",
      tutorId: "",
      students: [],
    });
  };

  const handleDelete = async () => {
    if (!deletingCohort?._id) return;
    await deleteMutation.mutateAsync(deletingCohort._id);
  };

  const handleGenerateCohorts = async () => {
    if (!selectedSchool?._id) {
      toast.error("No school selected");
      return;
    }

    if (!selectedProgramId) {
      toast.error("Please select a program for cohort generation");
      return;
    }

    if (!cohortStatus || cohortStatus.studentsAwaitingAssignment === 0) {
      toast.error("No students awaiting cohort assignment");
      return;
    }

    setIsGenerating(true);
    generateCohortsMutation.mutate({ 
      schoolId: selectedSchool._id,
      programId: selectedProgramId 
    });
  };

  const handleStudentChange = (studentId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      students: checked
        ? [...prev.students, studentId]
        : prev.students.filter((id) => id !== studentId),
    }));
  };

  const getSchoolName = (schoolId: string) => {
    return schools.find((school) => school._id === schoolId)?.name || schoolId;
  };

  const getTutorName = (tutorId: string) => {
    return allTutors.find((tutor) => tutor.id === tutorId)?.name || tutorId;
  };

  const getStudentName = (studentId: string) => {
    return (
      allStudents.find((student) => student._id === studentId)?.name ||
      studentId
    );
  };

  if (isLoadingCohorts) {
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
            <Users className="w-24 h-24" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No School Selected</h3>
          <p className="text-muted-foreground mb-4">
            Please select a school from the sidebar to manage cohorts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Cohorts</h1>
          <p className="text-muted-foreground">
            Create and manage student cohorts
            {selectedSchool && (
              <span className="ml-2 text-primary font-medium">
                • {selectedSchool.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {cohortStatus && cohortStatus.studentsAwaitingAssignment > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Label htmlFor="program-select" className="text-sm whitespace-nowrap">
                  Program:
                </Label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger id="program-select" className="w-48">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program._id} value={program._id}>
                        {program.name} ({program.subject})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateCohorts}
                disabled={isGenerating || !selectedProgramId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Generate Optimal Cohorts"}
              </Button>
            </>
          )}
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cohort
          </Button>
        </div>
      </div>

      {/* Cohort Status Indicator */}
      {selectedSchool && cohortStatus && (
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cohortStatus.studentsAwaitingAssignment > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-yellow-700">
                    {cohortStatus.studentsAwaitingAssignment} students awaiting
                    cohort assignment
                  </span>
                </div>
              ) : cohortStatus.studentsWithAssessments > 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    All students are assigned to cohorts
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-600">
                    No students with assessments found
                  </span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {cohortStatus.studentsInCohorts}/
              {cohortStatus.studentsWithAssessments} assigned
            </div>
          </div>

          {cohortStatus.studentsAwaitingAssignment > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>💡 Recommendation:</strong> Use automated cohort
                generation for most efficient grouping. Our algorithm creates
                optimal cohorts of 5-30 students based on assessment levels,
                ensuring balanced learning groups.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCohorts?.map((cohort) => (
              <TableRow key={cohort._id}>
                <TableCell>{cohort.name}</TableCell>
                <TableCell>
                  {getSchoolName(
                    typeof cohort.schoolId === "string"
                      ? cohort.schoolId
                      : cohort.schoolId?._id
                  )}
                </TableCell>
                <TableCell>
                  {getTutorName(
                    typeof cohort.tutorId === "string"
                      ? cohort.tutorId
                      : cohort.tutorId?._id
                  )}
                </TableCell>
                <TableCell>
                  {Array.isArray(cohort.students)
                    ? cohort.students
                        .map((sid) => getStudentName(sid))
                        .join(", ")
                    : ""}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cohort)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingCohort(cohort);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCohort ? "Edit Cohort" : "Create Cohort"}
            </DialogTitle>
            <DialogDescription>
              {editingCohort
                ? "Update the cohort's information below"
                : "Fill in the details to create a new cohort"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Cohort Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolId">School</Label>
              <Select
                value={formData.schoolId}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    schoolId: value,
                    tutorId: "",
                    students: [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools
                    .filter((school) => school._id)
                    .map((school) => (
                      <SelectItem key={school._id} value={school._id!}>
                        {school.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tutorId">Tutor</Label>
              <Select
                value={formData.tutorId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tutorId: value }))
                }
                disabled={!formData.schoolId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Students</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={student._id}
                        checked={formData.students.includes(student._id)}
                        onCheckedChange={(checked) =>
                          handleStudentChange(student._id, checked as boolean)
                        }
                      />
                      <Label htmlFor={student._id} className="text-sm">
                        {student.name}
                      </Label>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formData.schoolId
                        ? "No students found for selected school"
                        : "Please select a school first"}
                    </p>
                  )}
                </div>
              </ScrollArea>
              {formData.students.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.students.length} student(s)
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.students.map((studentId) => (
                      <Badge
                        key={studentId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {getStudentName(studentId)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
              {editingCohort ? "Update" : "Create"}
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
              cohort "{deletingCohort?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ManageCohorts;
