import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCohort,
  deleteCohort,
  getCohorts,
  updateCohort,
  type Cohort,
  type CreateCohortDTO,
  type UpdateCohortDTO,
} from "@/services/cohorts";
import { getSchools, type School } from "@/services/schools";
import { getMentors, type Mentor } from "@/services/mentors";
import { getStudents, type Student } from "@/services/students";
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
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Edit } from "lucide-react";

function ManageCohorts() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [deletingCohort, setDeletingCohort] = useState<Cohort | null>(null);
  const [formData, setFormData] = useState<CreateCohortDTO>({
    name: "",
    schoolId: "",
    mentorId: "",
    students: [],
  });

  const queryClient = useQueryClient();

  // Fetch cohorts
  const { data: cohorts, isLoading: isLoadingCohorts } = useQuery({
    queryKey: ["cohorts"],
    queryFn: () => getCohorts(),
  });

  // Fetch all schools, mentors, students for name lookup
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });
  const { data: mentors = [] } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => getMentors(),
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  });

  // Create cohort mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCohortDTO) => createCohort(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
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
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
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
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      setIsDeleteDialogOpen(false);
      toast.success("Cohort deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete cohort");
    },
  });

  const handleSubmit = () => {
    if (editingCohort) {
      const { name, mentorId, students } = formData;
      updateMutation.mutate({
        id: editingCohort._id,
        data: { name, mentorId, students },
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
      mentorId: cohort.mentorId._id,
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
      mentorId: "",
      students: [],
    });
  };

  const handleDelete = async () => {
    if (!deletingCohort?._id) return;
    await deleteMutation.mutateAsync(deletingCohort._id);
  };

  if (isLoadingCohorts) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Cohort
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohorts?.map((cohort) => (
              <TableRow key={cohort._id}>
                <TableCell>{cohort.name}</TableCell>
                <TableCell>
                  {(() => {
                    const schoolId =
                      typeof cohort.schoolId === "string"
                        ? cohort.schoolId
                        : cohort.schoolId?._id;
                    const school = schools.find(
                      (s: School) => s._id === schoolId
                    );
                    return school ? school.name : schoolId;
                  })()}
                </TableCell>
                <TableCell>
                  {(() => {
                    const mentorId =
                      typeof cohort.mentorId === "string"
                        ? cohort.mentorId
                        : cohort.mentorId?._id;
                    const mentor = mentors.find(
                      (m: Mentor) => m._id === mentorId
                    );
                    return mentor ? mentor.name : mentorId;
                  })()}
                </TableCell>
                <TableCell>
                  {Array.isArray(cohort.students)
                    ? cohort.students
                        .map((sid) => {
                          const student = students.find(
                            (s: Student) => s._id === sid
                          );
                          return student ? student.name : sid;
                        })
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
              <Label htmlFor="schoolId">School ID</Label>
              <Input
                id="schoolId"
                value={formData.schoolId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    schoolId: e.target.value,
                    mentorId: "",
                    students: [],
                  }))
                }
                placeholder="Enter school ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentorId">Mentor ID</Label>
              <Input
                id="mentorId"
                value={formData.mentorId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mentorId: e.target.value }))
                }
                placeholder="Enter mentor ID"
                disabled={!formData.schoolId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="students">Student IDs (comma separated)</Label>
              <Input
                id="students"
                value={formData.students.join(",")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    students: e.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="Enter student IDs separated by comma"
              />
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
