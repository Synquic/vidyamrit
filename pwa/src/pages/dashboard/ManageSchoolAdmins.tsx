import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSchoolAdmin,
  deleteSchoolAdmin,
  getSchoolAdmins,
  type SchoolAdmin,
  type CreateSchoolAdminDTO,
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
import { Plus, Loader2, Trash2 } from "lucide-react";

function ManageSchoolAdmins() {
  const [isOpen, setIsOpen] = useState(false);
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
      toast({
        title: "Success",
        description: "School admin created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create school admin",
        variant: "destructive",
      });
    },
  });

  // Delete school admin mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSchoolAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolAdmins"] });
      toast({
        title: "Success",
        description: "School admin deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete school admin",
        variant: "destructive",
      });
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
    };
    createMutation.mutate(data);
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
            {schoolAdmins?.map((admin: SchoolAdmin) => (
              <TableRow key={admin._id}>
                <TableCell>{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.schoolId.name}</TableCell>
                <TableCell>
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
