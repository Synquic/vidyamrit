"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  School,
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from "@/services/schools";

function ManageSchools() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [deletingSchool, setDeletingSchool] = useState<School | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [formData, setFormData] = useState<
    Omit<School, "_id" | "createdAt" | "updatedAt"> & {
      pointOfContacts?: Array<{ name: string; phone: string }>;
    }
  >({
    name: "",
    type: "government",
    udise_code: "",
    address: "",
    level: "primary",
    city: "",
    state: "",
    establishedYear: new Date().getFullYear(),
    pinCode: "",
    pointOfContact: "",
    phone: "",
    block: "",
    pointOfContacts: [{ name: "", phone: "" }],
  });

  const {
    data: schools = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  const createMutation = useMutation({
    mutationFn: createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School created successfully");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to create school");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<School> }) =>
      updateSchool(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School updated successfully");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Failed to update school");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingSchool(null);
    },
    onError: () => {
      toast.error("Failed to delete school");
    },
  });

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      type: school.type,
      udise_code: school.udise_code || "",
      address: school.address,
      level: school.level || "primary",
      city: school.city,
      state: school.state,
      establishedYear: school.establishedYear,
      pinCode: school.pinCode,
      pointOfContact: school.pointOfContact || "",
      phone: school.phone || "",
      block: school.block || "",
      pointOfContacts:
        (school as any).pointOfContacts && (school as any).pointOfContacts.length
          ? (school as any).pointOfContacts
          : [{ name: school.pointOfContact || "", phone: school.phone || "" }],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSchool?._id) return;
    if (confirmDeleteText !== deletingSchool.name) {
      toast.error("Confirmation text does not match school name");
      return;
    }
    await deleteMutation.mutateAsync(deletingSchool._id);
    setConfirmDeleteText("");
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSchool(null);
    setFormData({
      name: "",
      type: "government",
      udise_code: "",
      address: "",
      level: "primary",
      city: "",
      state: "",
      establishedYear: new Date().getFullYear(),
      pinCode: "",
      pointOfContact: "",
      phone: "",
      block: "",
      pointOfContacts: [{ name: "", phone: "" }],
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500">Error loading schools</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
          <p className="text-muted-foreground">
            Manage your schools and their information
          </p>
        </div>
        <Button
          onClick={() => {
            // Reset to blank add form (default type = government)
            setEditingSchool(null);
            setFormData({
              name: "",
              type: "government",
              udise_code: "",
              address: "",
              level: "primary",
              city: "",
              state: "",
              establishedYear: new Date().getFullYear(),
              pinCode: "",
              pointOfContact: "",
              phone: "",
              block: "",
              pointOfContacts: [{ name: "", phone: "" }],
            });
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </Button>
      </div>

      {schools.length === 0 ? (
        <div className="flex items-center justify-center">
          <Card className="text-center w-full max-w-xl">
            <CardHeader>
              <CardTitle>No schools yet</CardTitle>
              <CardDescription>
                It looks like you haven't added any schools. Add a school to get
                started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Schools help you organise students, cohorts and attendance.
                </p>
                <Button
                  onClick={() => {
                    // Reset to blank add form (default type = government)
                    setEditingSchool(null);
                    setFormData({
                      name: "",
                      type: "government",
                      udise_code: "",
                      address: "",
                      level: "primary",
                      city: "",
                      state: "",
                      establishedYear: new Date().getFullYear(),
                      pinCode: "",
                      pointOfContact: "",
                      phone: "",
                      pointOfContacts: [{ name: "", phone: "" }],
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first school
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Name</TableHead>
                <TableHead>UDISE Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>PIN Code</TableHead>
                <TableHead>Established</TableHead>
                <TableHead>Point of Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((school) => (
                <TableRow key={school._id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>{school.udise_code || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {school.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{school.level || "-"}</TableCell>
                  <TableCell>{school.block || "-"}</TableCell>
                  <TableCell>{school.city}</TableCell>
                  <TableCell>{school.state}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {school.address || "-"}
                  </TableCell>
                  <TableCell>{school.pinCode || "-"}</TableCell>
                  <TableCell>{school.establishedYear || "-"}</TableCell>
                  <TableCell>{school.pointOfContact || "-"}</TableCell>
                  <TableCell>{school.phone || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(school)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingSchool(school);
                          setConfirmDeleteText("");
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingSchool ? "Edit School" : "Add New School"}
            </DialogTitle>
            <DialogDescription>
              {editingSchool
                ? "Update the school information below"
                : "Fill in the details to add a new school"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 my-4">
            <div className="grid gap-3 py-4">
              {/* School Type & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="type">School Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "government" | "private") =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: "primary" | "middle") =>
                      setFormData((prev) => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="middle">Middle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="udise_code">UDISE Code</Label>
                  <Input
                    id="udise_code"
                    value={formData.udise_code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        udise_code: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* School Name & Block */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 col-span-1 sm:col-span-3">
                  <Label htmlFor="name">School Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="block">Block</Label>
                  <Select
                    value={formData.block || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, block: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indore Urban 1">Indore Urban 1</SelectItem>
                      <SelectItem value="Indore Urban 2">Indore Urban 2</SelectItem>
                      <SelectItem value="Indore Rural">Indore Rural</SelectItem>
                      <SelectItem value="Sanwer">Sanwer</SelectItem>
                      <SelectItem value="Mhow">Mhow</SelectItem>
                      <SelectItem value="Depalpur">Depalpur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Year & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Year Established</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        establishedYear:
                          parseInt(e.target.value) || new Date().getFullYear(),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pinCode">PIN Code</Label>
                  <Input
                    id="pinCode"
                    value={formData.pinCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pinCode: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Points of Contact (multiple) */}
              <div className="space-y-2">
                <Label>Points of Contact</Label>
                <div className="space-y-2">
                  {(formData.pointOfContacts || []).map((poc, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={poc.name}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const next = { ...(prev as any) };
                              next.pointOfContacts = (next.pointOfContacts || []).slice();
                              next.pointOfContacts[idx] = {
                                ...next.pointOfContacts[idx],
                                name: e.target.value,
                              };
                              return next;
                            })
                          }
                        />
                      </div>
                      <div className="col-span-5">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          value={poc.phone}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const next = { ...(prev as any) };
                              next.pointOfContacts = (next.pointOfContacts || []).slice();
                              next.pointOfContacts[idx] = {
                                ...next.pointOfContacts[idx],
                                phone: e.target.value,
                              };
                              return next;
                            })
                          }
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setFormData((prev) => {
                              const next = { ...(prev as any) };
                              next.pointOfContacts = (next.pointOfContacts || []).slice();
                              next.pointOfContacts.splice(idx, 1);
                              if (next.pointOfContacts.length === 0) next.pointOfContacts = [{ name: "", phone: "" }];
                              return next;
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...(prev as any),
                          pointOfContacts: [
                            ...(prev.pointOfContacts || [{ name: "", phone: "" }]),
                            { name: "", phone: "" },
                          ],
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add contact
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
            <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // map pointOfContacts into legacy fields for backward compatibility
                const payload: any = { ...(formData as any) };
                if (formData.pointOfContacts && formData.pointOfContacts.length > 0) {
                  payload.pointOfContact = formData.pointOfContacts[0].name;
                  payload.phone = formData.pointOfContacts[0].phone;
                }
                if (editingSchool) {
                  updateMutation.mutate({ id: editingSchool._id!, data: payload });
                } else {
                  createMutation.mutate(payload);
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingSchool ? "Update" : "Create"} School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setConfirmDeleteText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              school "{deletingSchool?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type the school's name to confirm: <span className="font-semibold">"{deletingSchool?.name}"</span>
            </Label>
            <Input
              id="confirm-delete"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder="Enter school name"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmDeleteText("")}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                deleteMutation.isPending ||
                confirmDeleteText !== deletingSchool?.name
              }
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
    </div>
  );
}

export default ManageSchools;
