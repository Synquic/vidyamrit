import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSchools } from "@/services/schools";
// import { programsService } from "@/services/programs";
import {
  createView,
  updateView,
  type CreateViewDTO,
  type UpdateViewDTO,
  type View,
  type StakeholderType,
  type ViewConfig,
} from "@/services/views";
import { toast } from "sonner";

interface CreateViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingView?: View | null;
}

const STAKEHOLDER_TYPES: { value: StakeholderType; label: string }[] = [
  { value: "principal", label: "Principal" },
  { value: "director", label: "Director" },
  { value: "education_minister", label: "Education Minister" },
  { value: "block_coordinator", label: "Block Coordinator" },
  { value: "district_coordinator", label: "District Coordinator" },
  { value: "state_coordinator", label: "State Coordinator" },
  { value: "custom", label: "Custom" },
];

const BLOCKS = [
  "Indore Urban 1",
  "Indore Urban 2",
  "Indore Rural",
  "Sanwer",
  "Mhow",
  "Depalpur",
];

export function CreateViewDialog({
  open,
  onOpenChange,
  onSuccess,
  editingView,
}: CreateViewDialogProps) {
  const [formData, setFormData] = useState<CreateViewDTO>({
    name: "",
    description: "",
    stakeholderType: "principal",
    customStakeholderType: "",
    config: {
      sections: {},
      access: {},
    },
    viewUser: {
      email: "",
      password: "",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch schools and programs
  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
    enabled: open,
  });

  // const { data: programsData } = useQuery({
  //   queryKey: ["programs"],
  //   queryFn: () => programsService.getPrograms({ isActive: "true" }),
  //   enabled: open,
  // });

  // Initialize form when editing
  useEffect(() => {
    if (editingView && open) {
      setFormData({
        name: editingView.name,
        description: editingView.description || "",
        stakeholderType: editingView.stakeholderType,
        customStakeholderType: editingView.customStakeholderType || "",
        config: editingView.config,
        viewUser: {
          email: editingView.viewUser.email,
          password: "", // Don't pre-fill password
        },
      });
    } else if (open && !editingView) {
      // Reset form for new view
      setFormData({
        name: "",
        description: "",
        stakeholderType: "principal",
        customStakeholderType: "",
        config: {
          sections: {},
          access: {},
        },
        viewUser: {
          email: "",
          password: "",
        },
      });
    }
    setErrors({});
  }, [editingView, open]);

  const updateSection = (
    sectionKey: keyof ViewConfig["sections"],
    updates: Partial<ViewConfig["sections"][typeof sectionKey]>
  ) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        sections: {
          ...prev.config.sections,
          [sectionKey]: {
            ...prev.config.sections[sectionKey],
            ...updates,
          },
        },
      },
    }));
  };

  const toggleSection = (
    sectionKey: keyof ViewConfig["sections"],
    enabled: boolean
  ) => {
    if (enabled) {
      // Initialize section with defaults
      const defaults: any = { enabled: true };
      if (sectionKey === "schools") {
        defaults.showTotal = true;
        defaults.showActive = true;
        defaults.showWithAssessments = true;
      } else if (sectionKey === "tutors" || sectionKey === "cohorts") {
        defaults.showTotal = true;
      } else if (sectionKey === "students") {
        defaults.showTotal = true;
        defaults.showActive = true;
        defaults.showDropped = true;
      } else if (sectionKey === "assessments") {
        defaults.showTotal = true;
      } else if (sectionKey === "progress") {
        defaults.views = [];
      } else if (sectionKey === "attendance") {
        defaults.views = [];
      }
      updateSection(sectionKey, defaults);
    } else {
      // Remove section
      setFormData((prev) => {
        const newSections = { ...prev.config.sections };
        delete newSections[sectionKey];
        return {
          ...prev,
          config: {
            ...prev.config,
            sections: newSections,
          },
        };
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.stakeholderType) {
      newErrors.stakeholderType = "Stakeholder type is required";
    }

    if (
      formData.stakeholderType === "custom" &&
      !formData.customStakeholderType?.trim()
    ) {
      newErrors.customStakeholderType = "Custom stakeholder type is required";
    }

    if (!editingView) {
      if (!formData.viewUser.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.viewUser.email)) {
        newErrors.email = "Invalid email format";
      }

      if (!formData.viewUser.password.trim()) {
        newErrors.password = "Password is required";
      } else if (formData.viewUser.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    // Check if at least one section is enabled
    const enabledSections = Object.values(formData.config.sections).filter(
      (s) => s?.enabled
    );
    if (enabledSections.length === 0) {
      newErrors.sections = "At least one section must be enabled";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      if (editingView) {
        // Update view
        const updateData: UpdateViewDTO = {
          name: formData.name,
          description: formData.description,
          stakeholderType: formData.stakeholderType,
          customStakeholderType:
            formData.stakeholderType === "custom"
              ? formData.customStakeholderType
              : undefined,
          config: formData.config,
        };
        await updateView(editingView._id, updateData);
        toast.success("View updated successfully");
      } else {
        // Create view
        await createView(formData);
        toast.success("View created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || "Failed to save view";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingView ? "Edit View" : "Create New View"}
          </DialogTitle>
          <DialogDescription>
            Configure a custom view for stakeholders to access specific data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  View Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Principal Dashboard - School XYZ"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Optional description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stakeholderType">
                  Stakeholder Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.stakeholderType}
                  onValueChange={(value: StakeholderType) =>
                    setFormData((prev) => ({
                      ...prev,
                      stakeholderType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAKEHOLDER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stakeholderType && (
                  <p className="text-sm text-destructive">
                    {errors.stakeholderType}
                  </p>
                )}
              </div>

              {formData.stakeholderType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customStakeholderType">
                    Custom Type <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customStakeholderType"
                    value={formData.customStakeholderType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customStakeholderType: e.target.value,
                      }))
                    }
                    placeholder="Enter custom stakeholder type"
                  />
                  {errors.customStakeholderType && (
                    <p className="text-sm text-destructive">
                      {errors.customStakeholderType}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Account */}
          {!editingView && (
            <Card>
              <CardHeader>
                <CardTitle>User Account</CardTitle>
                <CardDescription>
                  Create login credentials for this view
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.viewUser.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        viewUser: {
                          ...prev.viewUser,
                          email: e.target.value,
                        },
                      }))
                    }
                    placeholder="user@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.viewUser.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        viewUser: {
                          ...prev.viewUser,
                          password: e.target.value,
                        },
                      }))
                    }
                    placeholder="Minimum 6 characters"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sections</CardTitle>
              <CardDescription>
                Select which data sections to include in this view
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.sections && (
                <p className="text-sm text-destructive">{errors.sections}</p>
              )}

              {/* Schools Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="section-schools"
                    checked={formData.config.sections.schools?.enabled || false}
                    onCheckedChange={(checked) =>
                      toggleSection("schools", checked as boolean)
                    }
                  />
                  <Label htmlFor="section-schools" className="font-semibold">
                    Schools
                  </Label>
                </div>
                {formData.config.sections.schools?.enabled && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="schools-showTotal"
                        checked={
                          formData.config.sections.schools?.showTotal !== false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("schools", {
                            showTotal: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="schools-showTotal">Show Total</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="schools-showActive"
                        checked={
                          formData.config.sections.schools?.showActive !== false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("schools", {
                            showActive: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="schools-showActive">Show Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="schools-showWithAssessments"
                        checked={
                          formData.config.sections.schools
                            ?.showWithAssessments !== false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("schools", {
                            showWithAssessments: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="schools-showWithAssessments">
                        Show With Assessments
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Tutors Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="section-tutors"
                    checked={formData.config.sections.tutors?.enabled || false}
                    onCheckedChange={(checked) =>
                      toggleSection("tutors", checked as boolean)
                    }
                  />
                  <Label htmlFor="section-tutors" className="font-semibold">
                    Tutors
                  </Label>
                </div>
                {formData.config.sections.tutors?.enabled && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tutors-showTotal"
                        checked={
                          formData.config.sections.tutors?.showTotal !== false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("tutors", {
                            showTotal: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="tutors-showTotal">Show Total</Label>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Students Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="section-students"
                    checked={
                      formData.config.sections.students?.enabled || false
                    }
                    onCheckedChange={(checked) =>
                      toggleSection("students", checked as boolean)
                    }
                  />
                  <Label htmlFor="section-students" className="font-semibold">
                    Students
                  </Label>
                </div>
                {formData.config.sections.students?.enabled && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="students-showTotal"
                        checked={
                          formData.config.sections.students?.showTotal !== false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("students", {
                            showTotal: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="students-showTotal">Show Total</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="students-showActive"
                        checked={
                          formData.config.sections.students?.showActive !==
                          false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("students", {
                            showActive: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="students-showActive">Show Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="students-showDropped"
                        checked={
                          formData.config.sections.students?.showDropped !==
                          false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("students", {
                            showDropped: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="students-showDropped">Show Dropped</Label>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Cohorts Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="section-cohorts"
                    checked={formData.config.sections.cohorts?.enabled || false}
                    onCheckedChange={(checked) =>
                      toggleSection("cohorts", checked as boolean)
                    }
                  />
                  <Label htmlFor="section-cohorts" className="font-semibold">
                    Cohorts
                  </Label>
                </div>
                {formData.config.sections.cohorts?.enabled && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cohorts-showTotal"
                        checked={
                          formData.config.sections.cohorts?.showTotal !== false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("cohorts", {
                            showTotal: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="cohorts-showTotal">Show Total</Label>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Assessments Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="section-assessments"
                    checked={
                      formData.config.sections.assessments?.enabled || false
                    }
                    onCheckedChange={(checked) =>
                      toggleSection("assessments", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="section-assessments"
                    className="font-semibold"
                  >
                    Assessments
                  </Label>
                </div>
                {formData.config.sections.assessments?.enabled && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="assessments-showTotal"
                        checked={
                          formData.config.sections.assessments?.showTotal !==
                          false
                        }
                        onCheckedChange={(checked) =>
                          updateSection("assessments", {
                            showTotal: checked as boolean,
                          })
                        }
                      />
                      <Label htmlFor="assessments-showTotal">Show Total</Label>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Progress Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="section-progress"
                    checked={
                      formData.config.sections.progress?.enabled || false
                    }
                    onCheckedChange={(checked) =>
                      toggleSection("progress", checked as boolean)
                    }
                  />
                  <Label htmlFor="section-progress" className="font-semibold">
                    Progress Tracking
                  </Label>
                </div>
                {formData.config.sections.progress?.enabled && (
                  <div className="ml-6 space-y-4">
                    <Label className="text-sm">Progress Views:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "group",
                        "student",
                        "school",
                        "block",
                        "district",
                        "state",
                        "cohort",
                        "program",
                      ].map((view) => (
                        <div key={view} className="flex items-center space-x-2">
                          <Checkbox
                            id={`progress-${view}`}
                            checked={
                              formData.config.sections.progress?.views?.includes(
                                view as any
                              ) || false
                            }
                            onCheckedChange={(checked) => {
                              const currentViews =
                                formData.config.sections.progress?.views || [];
                              const newViews = checked
                                ? [...currentViews, view as any]
                                : currentViews.filter((v) => v !== view);
                              updateSection("progress", { views: newViews });
                            }}
                          />
                          <Label
                            htmlFor={`progress-${view}`}
                            className="text-sm capitalize"
                          >
                            {view}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Attendance Section */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="section-attendance"
                    checked={
                      formData.config.sections.attendance?.enabled || false
                    }
                    onCheckedChange={(checked) =>
                      toggleSection("attendance", checked as boolean)
                    }
                  />
                  <Label htmlFor="section-attendance" className="font-semibold">
                    Attendance Tracking
                  </Label>
                </div>
                {formData.config.sections.attendance?.enabled && (
                  <div className="ml-6 space-y-4">
                    <Label className="text-sm">Attendance Views:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["student", "cohort", "school", "block", "state"].map(
                        (view) => (
                          <div
                            key={view}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`attendance-${view}`}
                              checked={
                                formData.config.sections.attendance?.views?.includes(
                                  view as any
                                ) || false
                              }
                              onCheckedChange={(checked) => {
                                const currentViews =
                                  formData.config.sections.attendance?.views ||
                                  [];
                                const newViews = checked
                                  ? [...currentViews, view as any]
                                  : currentViews.filter((v) => v !== view);
                                updateSection("attendance", {
                                  views: newViews,
                                });
                              }}
                            />
                            <Label
                              htmlFor={`attendance-${view}`}
                              className="text-sm capitalize"
                            >
                              {view}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                Limit which schools, blocks, or states this view can access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Allowed Schools (leave empty for all)</Label>
                {schools && schools.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                    {schools.map((school) => (
                      <div
                        key={school._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`school-${school._id}`}
                          checked={
                            formData.config.access.allowedSchools?.includes(
                              school._id!
                            ) || false
                          }
                          onCheckedChange={(checked) => {
                            const current =
                              formData.config.access.allowedSchools || [];
                            const newSchools = checked
                              ? [...current, school._id!]
                              : current.filter((id) => id !== school._id);
                            setFormData((prev) => ({
                              ...prev,
                              config: {
                                ...prev.config,
                                access: {
                                  ...prev.config.access,
                                  allowedSchools: newSchools,
                                },
                              },
                            }));
                          }}
                        />
                        <Label
                          htmlFor={`school-${school._id}`}
                          className="text-sm"
                        >
                          {school.name} ({school.block || "No block"})
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Loading schools...
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Allowed Blocks (leave empty for all)</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {BLOCKS.map((block) => (
                    <div key={block} className="flex items-center space-x-2">
                      <Checkbox
                        id={`block-${block}`}
                        checked={
                          formData.config.access.allowedBlocks?.includes(
                            block
                          ) || false
                        }
                        onCheckedChange={(checked) => {
                          const current =
                            formData.config.access.allowedBlocks || [];
                          const newBlocks = checked
                            ? [...current, block]
                            : current.filter((b) => b !== block);
                          setFormData((prev) => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              access: {
                                ...prev.config.access,
                                allowedBlocks: newBlocks,
                              },
                            },
                          }));
                        }}
                      />
                      <Label htmlFor={`block-${block}`} className="text-sm">
                        {block}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed States (leave empty for all)</Label>
                {schools && schools.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                    {Array.from(new Set(schools.map((s) => s.state))).map(
                      (state) => (
                        <div
                          key={state}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`state-${state}`}
                            checked={
                              formData.config.access.allowedStates?.includes(
                                state
                              ) || false
                            }
                            onCheckedChange={(checked) => {
                              const current =
                                formData.config.access.allowedStates || [];
                              const newStates = checked
                                ? [...current, state]
                                : current.filter((s) => s !== state);
                              setFormData((prev) => ({
                                ...prev,
                                config: {
                                  ...prev.config,
                                  access: {
                                    ...prev.config.access,
                                    allowedStates: newStates,
                                  },
                                },
                              }));
                            }}
                          />
                          <Label htmlFor={`state-${state}`} className="text-sm">
                            {state}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Loading states...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingView ? "Update View" : "Create View"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
