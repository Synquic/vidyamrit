import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createVolunteer,
  deleteVolunteer,
  getAllVolunteers,
  getVolunteersBySchool,
  updateVolunteerStatus,
  extendVolunteerAccess,
  type Volunteer,
  type CreateVolunteerDTO,
} from "@/services/volunteers";
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
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Users, 
  Clock, 
  Power, 
  PowerOff, 
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

function ManageVolunteers() {
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [deletingVolunteer, setDeletingVolunteer] = useState<Volunteer | null>(null);
  const [createdVolunteer, setCreatedVolunteer] = useState<Volunteer | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateVolunteerDTO>({
    schoolId: "",
    durationHours: 24,
    volunteerName: "Volunteer",
  });

  const queryClient = useQueryClient();

  // Fetch volunteers - filter by school if context is active
  const { data: volunteers, isLoading: isLoadingVolunteers } = useQuery({
    queryKey: ["volunteers", selectedSchool?._id],
    queryFn: () => selectedSchool?._id
      ? getVolunteersBySchool(selectedSchool._id)
      : getAllVolunteers(),
    enabled: user?.role === UserRole.SUPER_ADMIN,
  });

  // Create volunteer mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateVolunteerDTO) => createVolunteer(data),
    onSuccess: (volunteer) => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      setCreatedVolunteer(volunteer);
      setIsCredentialsDialogOpen(true);
      handleCloseDialog();
      toast.success("Volunteer account created successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to create volunteer";
      toast.error(message);
    },
  });

  // Update volunteer status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateVolunteerStatus(id, { isActive }),
    onSuccess: (volunteer) => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast.success(`Volunteer ${volunteer.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to update volunteer status";
      toast.error(message);
    },
  });

  // Extend volunteer access mutation
  const extendAccessMutation = useMutation({
    mutationFn: ({ id, additionalHours }: { id: string; additionalHours: number }) =>
      extendVolunteerAccess(id, { additionalHours }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast.success("Volunteer access extended successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to extend volunteer access";
      toast.error(message);
    },
  });

  // Delete volunteer mutation
  const deleteMutation = useMutation({
    mutationFn: deleteVolunteer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      setIsDeleteDialogOpen(false);
      setDeletingVolunteer(null);
      toast.success("Volunteer deleted successfully");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to delete volunteer";
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    if (!selectedSchool) {
      toast.error("Please select a school first");
      return;
    }

    if (!formData.durationHours || formData.durationHours <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }

    createMutation.mutate(formData);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setFormData({
      schoolId: selectedSchool?._id || "",
      durationHours: 24,
      volunteerName: "Volunteer",
    });
  };

  const handleDelete = async () => {
    if (!deletingVolunteer?.id) return;
    await deleteMutation.mutateAsync(deletingVolunteer.id);
  };

  const handleToggleStatus = (volunteer: Volunteer) => {
    updateStatusMutation.mutate({
      id: volunteer.id,
      isActive: !volunteer.isActive,
    });
  };

  const handleExtendAccess = (volunteer: Volunteer, hours: number) => {
    extendAccessMutation.mutate({
      id: volunteer.id,
      additionalHours: hours,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Only super admin can access this page
  if (user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            Only super administrators can manage volunteers.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingVolunteers) {
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
          <h1 className="text-2xl md:text-3xl font-bold">Manage Volunteers</h1>
          <p className="text-muted-foreground">
            Create and manage volunteer accounts for schools
          </p>
        </div>
        <Button 
          onClick={() => {
            setFormData({
              schoolId: selectedSchool?._id || "",
              durationHours: 24,
              volunteerName: "Volunteer",
            });
            setIsOpen(true);
          }} 
          disabled={!selectedSchool}
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Volunteer Account
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
              Showing volunteers for this school only
            </p>
          </CardContent>
        </Card>
      )}

      {/* Volunteers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Accounts ({volunteers?.length || 0})</CardTitle>
          <CardDescription>
            Manage volunteer accounts with time-limited access for baseline assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!volunteers || volunteers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No volunteers found</h3>
              <p className="text-muted-foreground mt-2">
                {selectedSchool
                  ? "No volunteer accounts for this school yet"
                  : "Create your first volunteer account to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time Remaining</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteers.map((volunteer) => {
                    const expired = isExpired(volunteer.expiresAt);
                    const timeRemaining = getTimeRemaining(volunteer.expiresAt);
                    
                    return (
                      <TableRow key={volunteer.id}>
                        <TableCell className="font-medium">
                          {volunteer.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{volunteer.schoolId?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {volunteer.isActive && !expired ? (
                              <Badge variant="default" className="bg-green-500">
                                <Power className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : expired ? (
                              <Badge variant="destructive">
                                <Clock className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <PowerOff className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={expired ? "text-red-600" : "text-green-600"}>
                            {timeRemaining}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(volunteer.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(volunteer)}
                              disabled={updateStatusMutation.isPending}
                            >
                              {volunteer.isActive ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExtendAccess(volunteer, 24)}
                              disabled={extendAccessMutation.isPending}
                              title="Extend by 24 hours"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeletingVolunteer(volunteer);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Volunteer Dialog */}
      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Volunteer Account</DialogTitle>
            <DialogDescription>
              Create a shared volunteer account for the selected school with time-limited access
            </DialogDescription>
          </DialogHeader>
          {selectedSchool && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-sm text-blue-700">
                Creating volunteer for: <strong>{selectedSchool.name}</strong>
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="volunteerName">Account Name</Label>
              <Input
                id="volunteerName"
                value={formData.volunteerName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, volunteerName: e.target.value }))
                }
                placeholder="Enter account name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationHours">Access Duration (Hours) *</Label>
              <Input
                id="durationHours"
                type="number"
                min="1"
                max="168" // 7 days max
                value={formData.durationHours}
                onChange={(e) =>
                  setFormData((prev) => ({ 
                    ...prev, 
                    durationHours: parseInt(e.target.value) || 24 
                  }))
                }
                placeholder="24"
              />
              <p className="text-xs text-muted-foreground">
                How long the volunteer account will remain active (1-168 hours)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volunteer Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Volunteer Account Created</DialogTitle>
            <DialogDescription>
              Share these credentials with volunteers. Save them securely as they won't be shown again.
            </DialogDescription>
          </DialogHeader>
          {createdVolunteer && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <Label className="text-sm font-medium">Email:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-background p-1 rounded border flex-1">
                      {createdVolunteer.email}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(createdVolunteer.email, "Email")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Password:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-background p-1 rounded border flex-1">
                      {showPassword ? createdVolunteer.password : "••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(createdVolunteer.password || "", "Password")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expires:</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(createdVolunteer.expiresAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-sm text-blue-700">
                  <strong>Important:</strong> Multiple volunteers can use the same login credentials 
                  simultaneously. They will only have access to student management and baseline assessments.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsCredentialsDialogOpen(false)}>
              I've Saved the Credentials
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
              This will permanently delete the volunteer account{" "}
              <strong>{deletingVolunteer?.name}</strong>. This action cannot be
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
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ManageVolunteers;