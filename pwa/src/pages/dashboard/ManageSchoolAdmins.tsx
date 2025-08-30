import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSchoolAdmin,
  deleteSchoolAdmin,
  getSchoolAdmins,
  updateSchoolAdmin,
  type SchoolAdmin,
  type CreateSchoolAdminDTO,
  type UpdateSchoolAdminDTO,
} from "@/services/schoolAdmins";
import { getSchools } from "@/services/schools";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Pencil } from "lucide-react";

function ManageSchoolAdmins() {
  const [isOpen, setIsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<SchoolAdmin | null>(null);
  const queryClient = useQueryClient();

  // Fetch school admins
  const { data: schoolAdmins, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ["schoolAdmins"],
    queryFn: getSchoolAdmins,
  });

  // Fetch schools for the select dropdown
  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Create school admin mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSchoolAdminDTO) => createSchoolAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolAdmins"] });
      setIsOpen(false);
      toast.success("School admin created successfully");
    },
    onError: () => {
      toast.error("Failed to create school admin");
    },
  });

  // Update school admin mutation
  const updateMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: UpdateSchoolAdminDTO }) =>
      updateSchoolAdmin(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolAdmins"] });
      setEditOpen(false);
      setEditAdmin(null);
      toast.success("School admin updated successfully");
    },
    onError: () => {
      toast.error("Failed to update school admin");
    },
  });

  // Delete school admin mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSchoolAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolAdmins"] });
      toast.success("School admin deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete school admin");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      schoolId: formData.get("schoolId") as string,
      phoneNo: formData.get("phoneNo") as string,
    };
    createMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editAdmin) return;
    const formData = new FormData(e.currentTarget);
    const data: UpdateSchoolAdminDTO = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      schoolId: formData.get("schoolId") as string,
      phoneNo: formData.get("phoneNo") as string,
    };
    updateMutation.mutate({ uid: editAdmin.uid, data });
  };

  if (isLoadingAdmins) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage School Admins</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add School Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create School Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolId">School</Label>
                <Select name="schoolId" required>
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
              <div className="space-y-2">
                <Label htmlFor="phoneNo">Phone No</Label>
                <Input id="phoneNo" name="phoneNo" type="text" required />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create School Admin
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit School Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editAdmin?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editAdmin?.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolId">School</Label>
                <Select
                  name="schoolId"
                  required
                  defaultValue={editAdmin?.schoolId._id}
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
              <div className="space-y-2">
                <Label htmlFor="phoneNo">Phone No</Label>
                <Input
                  id="phoneNo"
                  name="phoneNo"
                  type="text"
                  required
                  defaultValue={editAdmin?.phoneNo}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update School Admin
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Phone No</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schoolAdmins?.map((admin: SchoolAdmin) => (
              <TableRow key={admin._id}>
                <TableCell>{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.schoolId.name}</TableCell>
                <TableCell>{admin.phoneNo}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditAdmin(admin);
                      setEditOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(admin.uid)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ManageSchoolAdmins;
