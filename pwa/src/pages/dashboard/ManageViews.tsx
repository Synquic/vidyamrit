import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getViews,
  deleteView,
  activateView,
  type View,
} from "@/services/views";
import { CreateViewDialog } from "@/components/views/CreateViewDialog";
import { Button } from "@/components/ui/button";
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
  Power,
  PowerOff,
  Eye,
  Edit,
} from "lucide-react";

function ManageViews() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<View | null>(null);
  const [deletingView, setDeletingView] = useState<View | null>(null);

  const queryClient = useQueryClient();

  // Fetch views
  const { data: views, isLoading } = useQuery({
    queryKey: ["views"],
    queryFn: getViews,
  });

  // Delete view mutation
  const deleteMutation = useMutation({
    mutationFn: deleteView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["views"] });
      setIsDeleteDialogOpen(false);
      setDeletingView(null);
      toast.success("View deleted successfully");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to delete view";
      toast.error(errorMessage);
    },
  });

  // Activate/Deactivate view mutation
  const activateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      activateView(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["views"] });
      toast.success(
        `View ${variables.isActive ? "activated" : "deactivated"} successfully`
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to update view status";
      toast.error(errorMessage);
    },
  });


  const handleDelete = (view: View) => {
    setDeletingView(view);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingView) {
      deleteMutation.mutate(deletingView._id);
    }
  };

  const handleToggleActive = (view: View) => {
    activateMutation.mutate({
      id: view._id,
      isActive: !view.viewUser.isActive,
    });
  };

  const getStakeholderTypeLabel = (type: string, custom?: string) => {
    const labels: Record<string, string> = {
      principal: "Principal",
      director: "Director",
      education_minister: "Education Minister",
      block_coordinator: "Block Coordinator",
      district_coordinator: "District Coordinator",
      state_coordinator: "State Coordinator",
      custom: custom || "Custom",
    };
    return labels[type] || type;
  };

  const getEnabledSections = (view: View) => {
    if (!view.config || !view.config.sections) {
      return "No sections configured";
    }
    const sections: string[] = [];
    if (view.config.sections.schools?.enabled) sections.push("Schools");
    if (view.config.sections.tutors?.enabled) sections.push("Tutors");
    if (view.config.sections.students?.enabled) sections.push("Students");
    if (view.config.sections.cohorts?.enabled) sections.push("Cohorts");
    if (view.config.sections.assessments?.enabled) sections.push("Assessments");
    if (view.config.sections.progress?.enabled) sections.push("Progress");
    if (view.config.sections.attendance?.enabled) sections.push("Attendance");
    return sections.length > 0 ? sections.join(", ") : "No sections enabled";
  };

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Views</h1>
            <p className="text-muted-foreground">
              Create and manage custom views for different stakeholders
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create View
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stakeholder Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Enabled Sections</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views && views.length > 0 ? (
              views.map((view) => (
                <TableRow key={view._id}>
                  <TableCell className="font-medium">{view.name}</TableCell>
                  <TableCell>
                    {getStakeholderTypeLabel(
                      view.stakeholderType,
                      view.customStakeholderType
                    )}
                  </TableCell>
                  <TableCell>{view.viewUser.email}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {getEnabledSections(view)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={view.viewUser.isActive ? "default" : "secondary"}
                    >
                      {view.viewUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {view.createdBy?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingView(view);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // For super admin, we can show a preview or navigate to view data
                          // View users will be automatically redirected to their dashboard
                          toast.info(
                            `View dashboard for: ${view.name}. View users can access this at /view-dashboard`
                          );
                        }}
                        title="View Dashboard (for view users)"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(view)}
                        disabled={activateMutation.isPending}
                      >
                        {view.viewUser.isActive ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(view)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No views found. Create your first view to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeletingView(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete View?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the view "{deletingView?.name}" and
              remove the associated user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateViewDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingView(null);
          }
        }}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          setEditingView(null);
        }}
        editingView={editingView}
      />
    </div>
  );
}

export default ManageViews;

