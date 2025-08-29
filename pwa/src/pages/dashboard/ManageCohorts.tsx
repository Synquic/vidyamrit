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
import { getSchools } from "@/services/schools";
import { getMentors } from "@/services/mentors";
import { getStudents } from "@/services/students";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Checkbox } from "@/components/ui/checkbox";
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
    studentIds: [],
  });

  const queryClient = useQueryClient();

  // Fetch cohorts
  const { data: cohorts, isLoading: isLoadingCohorts } = useQuery({
    queryKey: ["cohorts"],
    queryFn: () => getCohorts(),
  });

  // Fetch schools for the select dropdown
  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Fetch mentors based on selected school
  const { data: mentors } = useQuery({
    queryKey: ["mentors", formData.schoolId],
    queryFn: () => getMentors(formData.schoolId),
    enabled: !!formData.schoolId,
  });

  // Fetch students based on selected school
  const { data: students } = useQuery({
    queryKey: ["students", formData.schoolId],
    queryFn: () => getStudents(formData.schoolId),
    enabled: !!formData.schoolId,
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
      const { name, mentorId, studentIds } = formData;
      updateMutation.mutate({
        id: editingCohort._id,
        data: { name, mentorId, studentIds },
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
      studentIds: cohort.students.map((student) => student._id),
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
      studentIds: [],
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
                <TableCell>{cohort.schoolId.name}</TableCell>
                <TableCell>{cohort.mentorId.name}</TableCell>
                <TableCell>{cohort.students.length} students</TableCell>
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
            {!editingCohort && (
              <div className="space-y-2">
                <Label htmlFor="schoolId">School</Label>
                <Select
                  value={formData.schoolId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      schoolId: value,
                      mentorId: "", // Reset mentor when school changes
                      studentIds: [], // Reset students when school changes
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools?.map((school) => (
                      <SelectItem key={school._id} value={school._id || ""}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mentorId">Mentor</Label>
              <Select
                value={formData.mentorId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, mentorId: value }))
                }
                disabled={!formData.schoolId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {mentors?.map((mentor) => (
                    <SelectItem key={mentor._id} value={mentor._id || ""}>
                      {mentor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Students</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {students?.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center space-x-2 py-1"
                  >
                    <Checkbox
                      id={student._id}
                      checked={formData.studentIds.includes(student._id || "")}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          studentIds: checked
                            ? [...prev.studentIds, student._id || ""]
                            : prev.studentIds.filter(
                                (id) => id !== student._id
                              ),
                        }));
                      }}
                    />
                    <label
                      htmlFor={student._id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {student.name}
                    </label>
                  </div>
                ))}
              </ScrollArea>
              {students?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No students found in this school
                </p>
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
