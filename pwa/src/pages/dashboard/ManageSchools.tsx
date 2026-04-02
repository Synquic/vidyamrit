"use client";

import { useState, useMemo } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/services";
import {
  School,
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from "@/services/schools";
import { INDIAN_STATES, STATE_CITIES } from "@/data/indianLocations";
import { programsService } from "@/services/programs";

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
    testPromotionType: "automatic" as "automatic" | "manual",
    groupFormat: undefined as "common" | "class_wise" | undefined,
    programs: [] as string[],
    pointOfContacts: [{ name: "", phone: "" }],
  });

  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockSearch, setBlockSearch] = useState("");

  const {
    data: schools = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Fetch programs for program selection
  const { data: programsData } = useQuery({
    queryKey: ["programs-for-school"],
    queryFn: () => programsService.getPrograms({ limit: 100 }),
  });
  const allPrograms = programsData?.programs || [];

  // Filter programs based on group format
  const filteredPrograms = useMemo(() => {
    if (formData.groupFormat === "common") {
      // Common: only show Remedial programs
      return allPrograms.filter((p: any) => p.name.toLowerCase().includes("remedial"));
    } else {
      // Class wise: show non-Remedial programs
      return allPrograms.filter((p: any) => !p.name.toLowerCase().includes("remedial"));
    }
  }, [allPrograms, formData.groupFormat]);

  // Get static cities for selected state
  const citiesForState = useMemo(() => {
    if (!formData.state) return [];
    return STATE_CITIES[formData.state] || [];
  }, [formData.state]);

  // Default blocks + unique blocks from existing schools
  const DEFAULT_BLOCKS = [
    "Indore Urban 1", "Indore Urban 2", "Indore Rural", "Sanwer", "Mhow", "Depalpur",
  ];
  const blocksForDropdown = useMemo(() => {
    const schoolBlocks = schools
      .filter((s) => s.block)
      .map((s) => s.block!);
    return [...new Set([...DEFAULT_BLOCKS, ...schoolBlocks])].sort();
  }, [schools]);

  const createMutation = useMutation({
    mutationFn: createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School created successfully");
      handleCloseDialog();
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create school"));
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
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update school"));
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
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete school"));
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
      testPromotionType: school.testPromotionType || "automatic",
      groupFormat: (school as any).groupFormat || undefined,
      programs: (school as any).programs?.map((p: any) => typeof p === 'object' ? p._id : p) || [],
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
      testPromotionType: "automatic" as "automatic" | "manual",
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
              testPromotionType: "automatic" as "automatic" | "manual",
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
                      testPromotionType: "automatic" as "automatic" | "manual",
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
                <TableHead>Test Mode</TableHead>
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
                  <TableCell>
                    <Badge variant={school.testPromotionType === "manual" ? "default" : "secondary"} className="capitalize">
                      {school.testPromotionType || "automatic"}
                    </Badge>
                  </TableCell>
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] w-[95vw] flex flex-col overflow-hidden p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingSchool ? "Edit School" : "Add New School"}
            </DialogTitle>
            <DialogDescription className="hidden sm:block">
              {editingSchool
                ? "Update the school information below"
                : "Fill in the details to add a new school"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-2 sm:px-6 my-2 sm:my-4">
            <div className="grid gap-3 py-2 sm:py-4">
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
                  <Label>Block</Label>
                  <Popover open={blockOpen} onOpenChange={setBlockOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={blockOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.block || "Select block..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[calc(100vw-2rem)] sm:w-[--radix-popover-trigger-width] p-0 max-h-[60vh] touch-pan-y overscroll-contain"
                      align="start"
                      side="bottom"
                      sideOffset={4}
                      style={{
                        maxHeight:
                          "var(--radix-popover-content-available-height, 60vh)",
                      }}
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search block..."
                          value={blockSearch}
                          onValueChange={setBlockSearch}
                        />
                        <CommandList
                          className="max-h-[200px] overflow-y-auto"
                          onWheel={(e) => {
                            e.stopPropagation();
                            e.currentTarget.scrollTop += e.deltaY;
                          }}
                        >
                          <CommandEmpty className="py-2 px-3 text-sm">
                            No block found.
                          </CommandEmpty>
                          <CommandGroup>
                            {blockSearch.trim() &&
                              !blocksForDropdown.some(
                                (b) => b.toLowerCase() === blockSearch.trim().toLowerCase()
                              ) && (
                                <CommandItem
                                  value={`add-${blockSearch.trim()}`}
                                  onSelect={() => {
                                    setFormData((prev) => ({ ...prev, block: blockSearch.trim() }));
                                    setBlockSearch("");
                                    setBlockOpen(false);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add "{blockSearch.trim()}"
                                </CommandItem>
                              )}
                            {blocksForDropdown
                              .filter((b) =>
                                b.toLowerCase().includes(blockSearch.toLowerCase())
                              )
                              .map((block) => (
                                <CommandItem
                                  key={block}
                                  value={block}
                                  onSelect={() => {
                                    setFormData((prev) => ({ ...prev, block }));
                                    setBlockSearch("");
                                    setBlockOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.block === block ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {block}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>


              {/* Test Promotion Type */}
              <div className="space-y-2">
                <Label htmlFor="testPromotionType">Test Mode</Label>
                <Select
                  value={formData.testPromotionType || "automatic"}
                  onValueChange={(value: "automatic" | "manual") =>
                    setFormData((prev) => ({ ...prev, testPromotionType: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select promotion type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatic: System promotes/ends test based on score. Manual: Teacher decides when to promote or assign level.
                </p>
              </div>

              {/* Group Format */}
              <div className="space-y-2">
                <Label htmlFor="groupFormat">Group Format</Label>
                <Select
                  value={formData.groupFormat || ""}
                  onValueChange={(value: "common" | "class_wise") =>
                    setFormData((prev) => ({ ...prev, groupFormat: value, programs: [] }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select group format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Intervention</SelectItem>
                    <SelectItem value="class_wise">Support</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Intervention: All classes together in one group. Support: Separate groups per class.
                </p>
              </div>

              {/* Programs */}
              <div className="space-y-2">
                <Label>Programs</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  {!formData.groupFormat ? (
                    <p className="text-sm text-muted-foreground">Select a group format first</p>
                  ) : filteredPrograms.length > 0 ? (
                    filteredPrograms.map((program: any) => (
                      <label
                        key={program._id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.programs?.includes(program._id) || false}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              programs: e.target.checked
                                ? [...(prev.programs || []), program._id]
                                : (prev.programs || []).filter((id: string) => id !== program._id),
                            }));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{program.name}</span>
                        <span className="text-xs text-muted-foreground">({program.subject})</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No programs available</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select programs that will be available in this school.
                </p>
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

              {/* State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, state: value, city: "" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={cityOpen}
                        className="w-full justify-between font-normal"
                        disabled={!formData.state}
                      >
                        {formData.city || "Select city..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                      side="bottom"
                      sideOffset={4}
                      style={{ maxHeight: "var(--radix-popover-content-available-height, 300px)" }}
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search city..."
                          value={citySearch}
                          onValueChange={setCitySearch}
                        />
                        <CommandList
                          className="max-h-[50vh] overflow-y-auto touch-pan-y overscroll-contain"
                        >
                          <CommandEmpty className="py-2 px-3 text-sm">
                            No city found.
                          </CommandEmpty>
                          <CommandGroup>
                            {citySearch.trim() &&
                              !citiesForState.some(
                                (c) => c.toLowerCase() === citySearch.trim().toLowerCase()
                              ) && (
                                <CommandItem
                                  value={`add-${citySearch.trim()}`}
                                  onSelect={() => {
                                    setFormData((prev) => ({ ...prev, city: citySearch.trim() }));
                                    setCitySearch("");
                                    setCityOpen(false);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add "{citySearch.trim()}"
                                </CommandItem>
                              )}
                            {citiesForState
                              .filter((c) =>
                                c.toLowerCase().includes(citySearch.toLowerCase())
                              )
                              .map((city) => (
                                <CommandItem
                                  key={city}
                                  value={city}
                                  onSelect={() => {
                                    setFormData((prev) => ({ ...prev, city }));
                                    setCitySearch("");
                                    setCityOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.city === city ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {city}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {!formData.state && (
                    <p className="text-xs text-muted-foreground">Select state first</p>
                  )}
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
