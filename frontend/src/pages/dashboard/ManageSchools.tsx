"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchoolAdminCards } from "@/components/SchoolCard";
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
// react-table removed — using card based UI
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
  const [formData, setFormData] = useState<
    Omit<School, "_id" | "createdAt" | "updatedAt">
  >({
    name: "",
    address: "",
    udise_code: "",
    type: "private",
    level: "primary",
    city: "",
    state: "",
    pinCode: "",
    establishedYear: new Date().getFullYear(),
    school_admin: "",
    contact_details: [
      { designation: "Principal", name: "", email: "", phone_no: "" },
    ],
    evaluationChecklist: {
      minEligibleStudents: {
        eligibleCount: 0,
        meetsCriteria: false,
        notes: "",
      },
      dedicatedRoom: { images: [], notes: "", submittedAt: undefined },
      supportDocuments: { documents: [], submittedAt: undefined },
      ngoHistory: [],
      infrastructureAdequacy: { rating: 0, notes: "" },
      systemOutput: "followup",
      status: "followup",
    },
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
    mutationFn: (school: School) => updateSchool(school._id!, school),
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
    },
    onError: () => {
      toast.error("Failed to delete school");
    },
  });

  const handleSubmit = async () => {
    if (editingSchool) {
      await updateMutation.mutateAsync({ ...editingSchool, ...formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address,
      udise_code: school.udise_code || "",
      type: school.type,
      level: school.level || "primary",
      city: school.city,
      state: school.state,
      pinCode: school.pinCode,
      establishedYear: school.establishedYear,
      school_admin: school.school_admin || "",
      contact_details:
        school.contact_details && school.contact_details.length
          ? school.contact_details
          : [{ designation: "Principal", name: "", email: "", phone_no: "" }],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSchool?._id) return;
    await deleteMutation.mutateAsync(deletingSchool._id);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSchool(null);
    setFormData({
      name: "",
      address: "",
      udise_code: "",
      type: "private",
      level: "primary",
      city: "",
      state: "",
      pinCode: "",
      establishedYear: new Date().getFullYear(),
      school_admin: "",
      contact_details: [
        { designation: "Principal", name: "", email: "", phone_no: "" },
      ],
      evaluationChecklist: {
        minEligibleStudents: {
          eligibleCount: 0,
          meetsCriteria: false,
          notes: "",
        },
        dedicatedRoom: { images: [], notes: "", submittedAt: undefined },
        supportDocuments: { documents: [], submittedAt: undefined },
        ngoHistory: [],
        infrastructureAdequacy: { rating: 0, notes: "" },
        systemOutput: "followup",
        status: "followup",
      },
    });
  };

  // no table; using card list below

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading schools</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
          <p className="text-muted-foreground">
            Manage schools in your organization
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New School
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {schools.length === 0 ? (
          <div className="col-span-full p-6 text-center text-muted-foreground">
            No schools found.
          </div>
        ) : (
          schools
            .filter((school) => school._id)
            .map((school) => (
              <div key={school._id} className="relative group">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(school)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeletingSchool(school);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <SchoolAdminCards
                  school={{
                    ...school,
                    _id: school._id || "",
                    createdAt: school.createdAt || new Date(),
                    updatedAt: school.updatedAt || new Date(),
                  }}
                />
              </div>
            ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col overflow-hidden">
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
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">School Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "government" | "private") =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: "primary" | "middle") =>
                    setFormData((prev) => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                    setFormData((prev) => ({ ...prev, state: e.target.value }))
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principalName">Principal Name</Label>
                <Input
                  id="principalName"
                  value={formData.contact_details?.[0]?.name || ""}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const contacts = prev.contact_details
                        ? [...prev.contact_details]
                        : [];
                      contacts[0] = {
                        ...(contacts[0] || {
                          designation: "Principal",
                          name: "",
                          email: "",
                          phone_no: "",
                        }),
                        name: e.target.value,
                      };
                      return { ...prev, contact_details: contacts };
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="establishedYear">Year Established</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={formData.establishedYear}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      establishedYear: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_details?.[0]?.email || ""}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const contacts = prev.contact_details
                        ? [...prev.contact_details]
                        : [];
                      contacts[0] = {
                        ...(contacts[0] || {
                          designation: "Principal",
                          name: "",
                          email: "",
                          phone_no: "",
                        }),
                        email: e.target.value,
                      };
                      return { ...prev, contact_details: contacts };
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.contact_details?.[0]?.phone_no || ""}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const contacts = prev.contact_details
                        ? [...prev.contact_details]
                        : [];
                      contacts[0] = {
                        ...(contacts[0] || {
                          designation: "Principal",
                          name: "",
                          email: "",
                          phone_no: "",
                        }),
                        phone_no: e.target.value,
                      };
                      return { ...prev, contact_details: contacts };
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_admin">School Admin (user id)</Label>
              <Input
                id="school_admin"
                value={formData.school_admin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    school_admin: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Other Contact Details</Label>
              {(formData.contact_details || []).map((c, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label>Designation</Label>
                    <Input
                      value={c.designation}
                      onChange={(e) => {
                        const contacts = [...(formData.contact_details || [])];
                        contacts[idx] = {
                          ...contacts[idx],
                          designation: e.target.value,
                        };
                        setFormData((prev) => ({
                          ...prev,
                          contact_details: contacts,
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={c.name}
                      onChange={(e) => {
                        const contacts = [...(formData.contact_details || [])];
                        contacts[idx] = {
                          ...contacts[idx],
                          name: e.target.value,
                        };
                        setFormData((prev) => ({
                          ...prev,
                          contact_details: contacts,
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={c.email}
                      onChange={(e) => {
                        const contacts = [...(formData.contact_details || [])];
                        contacts[idx] = {
                          ...contacts[idx],
                          email: e.target.value,
                        };
                        setFormData((prev) => ({
                          ...prev,
                          contact_details: contacts,
                        }));
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={c.phone_no}
                        onChange={(e) => {
                          const contacts = [
                            ...(formData.contact_details || []),
                          ];
                          contacts[idx] = {
                            ...contacts[idx],
                            phone_no: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            contact_details: contacts,
                          }));
                        }}
                      />
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const contacts = [
                            ...(formData.contact_details || []),
                          ];
                          contacts.splice(idx, 1);
                          setFormData((prev) => ({
                            ...prev,
                            contact_details: contacts,
                          }));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    contact_details: [
                      ...(prev.contact_details || []),
                      { designation: "", name: "", email: "", phone_no: "" },
                    ],
                  }));
                }}
              >
                Add Contact
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eligibleCount">Min. Eligible Students</Label>
                <Input
                  id="eligibleCount"
                  type="number"
                  value={
                    formData.evaluationChecklist?.minEligibleStudents
                      ?.eligibleCount || 0
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      evaluationChecklist: {
                        ...prev.evaluationChecklist,
                        minEligibleStudents: {
                          ...(prev.evaluationChecklist?.minEligibleStudents ||
                            {}),
                          eligibleCount: parseInt(e.target.value || "0"),
                        },
                      },
                    }))
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="meetsCriteria"
                    type="checkbox"
                    checked={
                      !!formData.evaluationChecklist?.minEligibleStudents
                        ?.meetsCriteria
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        evaluationChecklist: {
                          ...prev.evaluationChecklist,
                          minEligibleStudents: {
                            ...(prev.evaluationChecklist?.minEligibleStudents ||
                              {}),
                            meetsCriteria: e.target.checked,
                          },
                        },
                      }))
                    }
                  />
                  <Label htmlFor="meetsCriteria">Meets Criteria</Label>
                </div>
                <Input
                  id="eligibleNotes"
                  value={
                    formData.evaluationChecklist?.minEligibleStudents?.notes ||
                    ""
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      evaluationChecklist: {
                        ...prev.evaluationChecklist,
                        minEligibleStudents: {
                          ...(prev.evaluationChecklist?.minEligibleStudents ||
                            {}),
                          notes: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Notes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="infrastructureRating">
                  Infrastructure Rating
                </Label>
                <Input
                  id="infrastructureRating"
                  type="number"
                  value={
                    formData.evaluationChecklist?.infrastructureAdequacy
                      ?.rating || 0
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      evaluationChecklist: {
                        ...prev.evaluationChecklist,
                        infrastructureAdequacy: {
                          ...(prev.evaluationChecklist
                            ?.infrastructureAdequacy || {}),
                          rating: parseInt(e.target.value || "0"),
                        },
                      },
                    }))
                  }
                />
                <Input
                  id="infrastructureNotes"
                  value={
                    formData.evaluationChecklist?.infrastructureAdequacy
                      ?.notes || ""
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      evaluationChecklist: {
                        ...prev.evaluationChecklist,
                        infrastructureAdequacy: {
                          ...(prev.evaluationChecklist
                            ?.infrastructureAdequacy || {}),
                          notes: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Notes"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>System Output</Label>
                    <Select
                      value={
                        formData.evaluationChecklist?.systemOutput || "followup"
                      }
                      onValueChange={(v: "include" | "followup" | "reject") =>
                        setFormData((prev) => ({
                          ...prev,
                          evaluationChecklist: {
                            ...prev.evaluationChecklist,
                            systemOutput: v,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="System Output" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="include">Include</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                        <SelectItem value="reject">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.evaluationChecklist?.status || "followup"}
                      onValueChange={(
                        v: "active" | "inactive" | "rejected" | "followup"
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          evaluationChecklist: {
                            ...prev.evaluationChecklist,
                            status: v,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
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
              {editingSchool ? "Update School" : "Add School"}
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
              school "{deletingSchool?.name}" and all associated data.
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

export default ManageSchools;
