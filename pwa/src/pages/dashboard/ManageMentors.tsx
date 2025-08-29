import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMentor,
  deleteMentor,
  getMentors,
  updateMentor,
  type Mentor,
  type CreateMentorDTO,
  type UpdateMentorDTO,
} from "@/services/mentors";
import { getSchools } from "@/services/schools";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
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
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Edit } from "lucide-react";

function ManageMentors() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [deletingMentor, setDeletingMentor] = useState<Mentor | null>(null);
  const [formData, setFormData] = useState<CreateMentorDTO>({
    name: "",
    email: "",
    password: "",
    schoolId: "",
  });

  const queryClient = useQueryClient();

  const { user } = useAuth();

  // Fetch mentors
  const { data: mentors, isLoading: isLoadingMentors } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => getMentors(),
    select: (data) => {
      // Filter mentors based on user role and school
      if (user?.role === UserRole.SUPER_ADMIN) {
        return data; // Show all mentors for super admin
      } else if (user && String(user.role) !== 'super_admin' && user.schoolId && typeof user.schoolId === "object") {
        return data.filter((mentor) => mentor.schoolId._id === user.schoolId._id);
      }
      return [];
    },
  });

  // Fetch schools for the select dropdown
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
    select: (data) => {
      // Filter schools based on user role
      if (user?.role === UserRole.SUPER_ADMIN) {
        return data; // Show all schools for super admin
      } else if (user && String(user.role) !== 'super_admin' && user.schoolId && typeof user.schoolId === "object") {
        return data.filter((school) => school._id === user.schoolId._id);
      }
      return [];
    },
  });

  // Create mentor mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateMentorDTO) => createMentor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      handleCloseDialog();
      toast.success("Mentor created successfully");
    },
    onError: () => {
      toast.error("Failed to create mentor");
    },
  });

  // Update mentor mutation
  const updateMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: UpdateMentorDTO }) =>
      updateMentor(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      handleCloseDialog();
      toast.success("Mentor updated successfully");
    },
    onError: () => {
      toast.error("Failed to update mentor");
    },
  });

  // Delete mentor mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMentor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setIsDeleteDialogOpen(false);
      toast.success("Mentor deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete mentor");
    },
  });

  const handleSubmit = () => {
    // If not super admin and has a schoolId, use that instead of form data
    const schoolIdToUse =
      user && String(user.role) !== 'super_admin' && user.schoolId && typeof user.schoolId === "object"
        ? user.schoolId._id
        : formData.schoolId;

    if (editingMentor) {
      const { name, email } = formData;
      updateMutation.mutate({
        uid: editingMentor.uid,
        data: { name, email, schoolId: schoolIdToUse },
      });
    } else {
      createMutation.mutate({ ...formData, schoolId: schoolIdToUse });
    }
  };

  const handleEdit = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setFormData({
      name: mentor.name,
      email: mentor.email,
      password: "", // Password is not included in edit
      schoolId: mentor.schoolId._id,
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingMentor(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      schoolId: "",
    });
  };

  const handleDelete = async () => {
    if (!deletingMentor?.uid) return;
    await deleteMutation.mutateAsync(deletingMentor.uid);
  };

  if (isLoadingMentors) {
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
          <h1 className="text-3xl font-bold">Manage Mentors</h1>
          <p className="text-muted-foreground">
            {user?.role === UserRole.SUPER_ADMIN
              ? "Create and manage mentors for all schools"
              : "Create and manage mentors for your school"}
          </p>
        </div>
        {/* Only show Add Mentor button if schools are available */}
        {schools.length > 0 && (
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Mentor
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mentors?.map((mentor) => (
              <TableRow key={mentor._id}>
                <TableCell>{mentor.name}</TableCell>
                <TableCell>{mentor.email}</TableCell>
                <TableCell>{mentor.schoolId.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(mentor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingMentor(mentor);
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
              {editingMentor ? "Edit Mentor" : "Create Mentor"}
            </DialogTitle>
            <DialogDescription>
              {editingMentor
                ? "Update the mentor's information below"
                : "Fill in the details to create a new mentor"}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            {!editingMentor && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            {/* Only show school selector for super admin */}
            {user?.role === UserRole.SUPER_ADMIN && (
              <div className="space-y-2">
                <Label htmlFor="schoolId">School</Label>
                <Select
                  value={formData.schoolId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, schoolId: value }))
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
              {editingMentor ? "Update" : "Create"}
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
              mentor "{deletingMentor?.name}" and remove them from any
              associated cohorts.
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

export default ManageMentors;
