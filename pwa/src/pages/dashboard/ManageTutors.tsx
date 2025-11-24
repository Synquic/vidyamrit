import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTutor,
  deleteTutor,
  getTutors,
  updateTutor,
  type Tutor,
  type CreateTutorDTO,
  type UpdateTutorDTO,
} from "@/services/tutors";
import { getSchools } from "@/services/schools";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Plus, Loader2, Trash2, Edit, Users } from "lucide-react";

function ManageTutors() {
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [deletingTutor, setDeletingTutor] = useState<Tutor | null>(null);
  const [formData, setFormData] = useState<CreateTutorDTO>({
    name: "",
    email: "",
    password: "",
    schoolId: "",
    phoneNo: "",
    role: "tutor",
  });

  const queryClient = useQueryClient();

  // Fetch tutors - filter by school if context is active
  const { data: tutors, isLoading: isLoadingTutors } = useQuery({
    queryKey: ["tutors", selectedSchool?._id],
    queryFn: () => getTutors(selectedSchool?._id),
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });

  // Fetch schools for the select dropdown (for super admin)
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });

  // Create tutor mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTutorDTO) => createTutor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      handleCloseDialog();
      toast.success("Tutor created successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to create tutor";
      toast.error(message);
    },
  });

  // Update tutor mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTutorDTO }) =>
      updateTutor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      handleCloseDialog();
      toast.success("Tutor updated successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to update tutor";
      toast.error(message);
    },
  });

  // Delete tutor mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTutor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      setIsDeleteDialogOpen(false);
      setDeletingTutor(null);
      toast.success("Tutor deleted successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to delete tutor";
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phoneNo) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!editingTutor && !formData.password) {
      toast.error("Password is required for new tutors");
      return;
    }

    if (!formData.schoolId) {
      toast.error("Please select a school");
      return;
    }

    if (editingTutor) {
      const { password, role, ...updateData } = formData;
      updateMutation.mutate({
        id: editingTutor.id,
        data: updateData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tutor: Tutor) => {
    setEditingTutor(tutor);
    setFormData({
      name: tutor.name,
      email: tutor.email,
      password: "", // Don't populate password for editing
      schoolId: tutor.schoolId._id,
      phoneNo: tutor.phoneNo,
      role: "tutor",
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingTutor(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      schoolId: selectedSchool?._id || "",
      phoneNo: "",
      role: "tutor",
    });
  };

  const handleDelete = async () => {
    if (!deletingTutor?.id) return;
    await deleteMutation.mutateAsync(deletingTutor.id);
  };

  // Only super admin can access this page
  if (user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            Only super administrators can manage tutors.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingTutors) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Tutors</h1>
          <p className="text-muted-foreground">
            Create and manage tutors for your schools
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Tutor
        </Button>
      </div>

      {/* Current School Context Display */}
      {selectedSchool && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Filtering by School
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{selectedSchool.name}</span>
              <Badge variant="outline">{selectedSchool.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Showing tutors for this school only
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tutors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tutors ({tutors?.length || 0})</CardTitle>
          <CardDescription>
            Manage tutor accounts and their school assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tutors || tutors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tutors found</h3>
              <p className="text-muted-foreground mt-2">
                {selectedSchool
                  ? "No tutors assigned to this school yet"
                  : "Create your first tutor to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell className="font-medium">
                        {tutor.name}
                      </TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>{tutor.phoneNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{tutor.schoolId?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Assigned
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(tutor.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tutor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeletingTutor(tutor);
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTutor ? "Edit Tutor" : "Create New Tutor"}
            </DialogTitle>
            <DialogDescription>
              {editingTutor
                ? "Update the tutor's information below"
                : "Fill in the details to create a new tutor account"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNo">Phone Number *</Label>
                <Input
                  id="phoneNo"
                  value={formData.phoneNo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phoneNo: e.target.value }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolId">Assign to School *</Label>
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
                    {schools.map((school) => (
                      <SelectItem key={school._id} value={school._id || ""}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter email address"
                disabled={!!editingTutor} // Don't allow email editing
              />
            </div>
            {!editingTutor && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
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
                  placeholder="Enter password"
                />
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
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingTutor ? "Update Tutor" : "Create Tutor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tutor account for{" "}
              <strong>{deletingTutor?.name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Tutor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ManageTutors;
