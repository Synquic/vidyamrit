import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  MoreHorizontal,
  Eye,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  programsService,
  IProgram,
  IProgramLevel,
  IAssessmentQuestion,
  QuestionType,
  TimeframeUnit,
} from "@/services/programs";

interface ProgramFormData {
  name: string;
  subject: string;
  description: string;
  totalLevels: number;
  levels: Omit<IProgramLevel, "_id">[];
}

function ManagePrograms() {
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<IProgram | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProgramFormData>({
    name: "",
    subject: "",
    description: "",
    totalLevels: 5,
    levels: [],
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle total levels change while preserving existing data
  const handleTotalLevelsChange = (
    newTotal: number,
    _questions?: IAssessmentQuestion[][]
  ) => {
    setFormData((prev) => {
      const currentLevels = [...prev.levels];
      const newLevels: Omit<IProgramLevel, "_id">[] = [];

      // Preserve existing levels up to the new total
      for (let i = 1; i <= newTotal; i++) {
        const existingLevel = currentLevels.find(
          (level) => level.levelNumber === i
        );

        if (existingLevel) {
          // Keep existing level data but ensure prerequisites are valid
          const validPrerequisites = existingLevel.prerequisites
            ? existingLevel.prerequisites.filter(
                (prereq) => prereq < i && prereq >= 1
              )
            : i > 1
            ? [i - 1]
            : [];

          newLevels.push({
            ...existingLevel,
            prerequisites:
              validPrerequisites.length > 0
                ? validPrerequisites
                : i > 1
                ? [i - 1]
                : [],
          });
        } else {
          // Create new level template for missing levels
          newLevels.push({
            ...programsService.createLevelTemplate(i),
            prerequisites: i > 1 ? [i - 1] : [],
          });
        }
      }

      return { ...prev, totalLevels: newTotal, levels: newLevels };
    });
  };

  // Initialize levels when totalLevels changes (only for new programs, not when editing)
  useEffect(() => {
    if (formData.totalLevels > 0 && !isEditDialogOpen) {
      setFormData((prev) => {
        const currentLevels = [...prev.levels];
        const newLevels: Omit<IProgramLevel, "_id">[] = [];

        // Preserve existing levels up to the new total
        for (let i = 1; i <= formData.totalLevels; i++) {
          const existingLevel = currentLevels.find(
            (level) => level.levelNumber === i
          );

          if (existingLevel) {
            // Keep existing level data but ensure prerequisites are valid
            const validPrerequisites = existingLevel.prerequisites
              ? existingLevel.prerequisites.filter(
                  (prereq) => prereq < i && prereq >= 1
                )
              : i > 1
              ? [i - 1]
              : [];

            newLevels.push({
              ...existingLevel,
              prerequisites:
                validPrerequisites.length > 0
                  ? validPrerequisites
                  : i > 1
                  ? [i - 1]
                  : [],
            });
          } else {
            // Create new level template for missing levels
            newLevels.push({
              ...programsService.createLevelTemplate(i),
              prerequisites: i > 1 ? [i - 1] : [],
            });
          }
        }

        // Only update if the levels count actually changed
        if (newLevels.length !== prev.levels.length) {
          return { ...prev, levels: newLevels };
        }
        return prev;
      });
    }
  }, [formData.totalLevels, isEditDialogOpen]);

  // Fetch programs
  const fetchPrograms = async (page = 1) => {
    try {
      setLoading(true);
      const response = await programsService.getPrograms({
        subject: subjectFilter !== "all" ? subjectFilter : undefined,
        isActive: statusFilter !== "all" ? statusFilter : undefined,
        includeInactive: statusFilter === "all" ? "true" : "false",
        page,
        limit: 10,
      });
      setPrograms(response.programs);
      setPagination(response.pagination);
    } catch (error) {
      toast.error("Failed to fetch programs");
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, statusFilter]);

  useEffect(() => {
    if (pagination.current > 1) {
      fetchPrograms(pagination.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current]);

  // Create program
  const handleCreateProgram = async () => {
    try {
      const errors = programsService.validateProgramData(formData);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      await programsService.createProgram(formData);
      toast.success("Program created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchPrograms();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create program";
      toast.error(errorMessage);
    }
  };

  // Import program from JSON file
  const handleImportProgram = async (file: File) => {
    try {
      const result = await programsService.importProgram(file);

      if (!result.success) {
        throw new Error(result.message || "Failed to import program");
      }

      toast.success(result.message || "Program imported successfully!");

      // Show additional info if available
      if (result.data) {
        const { totalLevels, totalQuestions } = result.data;
        toast.success(
          `Imported ${totalLevels} levels with ${totalQuestions} questions!`
        );
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => {
          toast.warning(warning);
        });
      }

      setIsImportDialogOpen(false);
      fetchPrograms();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to import program";
      toast.error(errorMessage);
    }
  };

  // Update program
  const handleUpdateProgram = async () => {
    if (!selectedProgram) return;

    try {
      const errors = programsService.validateProgramData(formData);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      await programsService.updateProgram(selectedProgram._id, formData);
      toast.success("Program updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedProgram(null);
      fetchPrograms();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update program";
      toast.error(errorMessage);
    }
  };

  // Delete program
  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      await programsService.deleteProgram(id);
      toast.success("Program deleted successfully");
      fetchPrograms();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete program";
      toast.error(errorMessage);
    }
  };

  // Toggle program status
  const handleToggleStatus = async (id: string) => {
    try {
      const result = await programsService.toggleProgramStatus(id);
      toast.success(result.message);
      fetchPrograms();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to toggle program status";
      toast.error(errorMessage);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      description: "",
      totalLevels: 5,
      levels: [],
    });
  };

  // Open edit dialog
  const openEditDialog = (program: IProgram) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      subject: program.subject,
      description: program.description,
      totalLevels: program.totalLevels,
      levels: program.levels,
    });
    setIsEditDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (program: IProgram) => {
    setSelectedProgram(program);
    setIsViewDialogOpen(true);
  };

  // Update level data
  const updateLevel = (
    index: number,
    field: keyof IProgramLevel,
    value:
      | string
      | number
      | TimeframeUnit
      | number[]
      | string[]
      | IAssessmentQuestion[]
  ) => {
    const newLevels = [...formData.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setFormData((prev) => ({ ...prev, levels: newLevels }));
  };

  // Filter programs based on search term
  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total duration for a program
  const calculateDuration = (levels: IProgramLevel[]) => {
    return programsService.calculateTotalDuration(levels, TimeframeUnit.WEEKS);
  };

  return (
    <div className="space-y-6">
      {isMobile ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center py-12">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Desktop Only Feature
              </h2>
              <p className="text-muted-foreground mb-6">
                The Program Management interface is optimized for desktop use only.
                Please access this page from a desktop or tablet device with a larger screen.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Recommended screen width: 768px or larger</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Programs</h1>
              <p className="text-muted-foreground">
                Create and manage educational programs with structured learning
                levels
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Program
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Program</DialogTitle>
                    <DialogDescription>
                      Upload a JSON file to import a complete program with levels
                      and questions
                    </DialogDescription>
                  </DialogHeader>
                  <ImportProgramDialog onImport={handleImportProgram} />
                </DialogContent>
              </Dialog>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Program
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Program</DialogTitle>
                    <DialogDescription>
                      Create a structured educational program with multiple learning
                      levels
                    </DialogDescription>
                  </DialogHeader>
                  <CreateProgramForm
                    formData={formData}
                    setFormData={setFormData}
                    updateLevel={updateLevel}
                    onSubmit={handleCreateProgram}
                    onCancel={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    handleTotalLevelsChange={handleTotalLevelsChange}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>{" "}
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search programs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="min-w-[150px]">
                  <Label>Subject</Label>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="math">Math</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[150px]">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Programs List */}
          <Card>
            <CardHeader>
              <CardTitle>Programs ({pagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading programs...</div>
              ) : filteredPrograms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No programs found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Levels</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrograms.map((program) => (
                      <TableRow key={program._id}>
                        <TableCell className="font-medium">
                          {program.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{program.subject}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {program.totalLevels}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {calculateDuration(program.levels)} weeks
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={program.isActive ? "default" : "secondary"}
                          >
                            {program.isActive ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(program.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => openViewDialog(program)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(program)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(program._id)}
                              >
                                {program.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteProgram(program._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        current: prev.current - 1,
                      }))
                    }
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {pagination.current} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        current: prev.current + 1,
                      }))
                    }
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Program</DialogTitle>
                <DialogDescription>
                  Update program details and learning levels
                </DialogDescription>
              </DialogHeader>
              <CreateProgramForm
                formData={formData}
                setFormData={setFormData}
                updateLevel={updateLevel}
                onSubmit={handleUpdateProgram}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                  setSelectedProgram(null);
                }}
                isEdit={true}
                handleTotalLevelsChange={handleTotalLevelsChange}
              />
            </DialogContent>
          </Dialog>
          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedProgram?.name}</DialogTitle>
                <DialogDescription>
                  Program details and level structure
                </DialogDescription>
              </DialogHeader>
              {selectedProgram && <ViewProgramDetails program={selectedProgram} />}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

// Create/Edit Program Form Component
interface CreateProgramFormProps {
  formData: ProgramFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProgramFormData>>;
  updateLevel: (
    index: number,
    field: keyof IProgramLevel,
    value:
      | string
      | number
      | TimeframeUnit
      | number[]
      | string[]
      | IAssessmentQuestion[]
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
  handleTotalLevelsChange?: (
    newTotal: number,
    questions?: IAssessmentQuestion[][]
  ) => void;
}

function CreateProgramForm({
  formData,
  setFormData,
  updateLevel,
  onSubmit,
  onCancel,
  isEdit = false,
  handleTotalLevelsChange,
}: CreateProgramFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Program Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter program name"
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subject: e.target.value }))
            }
            placeholder="e.g., Hindi, English, Math"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter program description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="totalLevels">Total Levels</Label>
        <Input
          id="totalLevels"
          type="number"
          min="1"
          max="50"
          value={formData.totalLevels}
          onChange={(e) => {
            const newTotal = parseInt(e.target.value) || 1;
            if (handleTotalLevelsChange) {
              handleTotalLevelsChange(newTotal);
            } else {
              setFormData((prev) => ({ ...prev, totalLevels: newTotal }));
            }
          }}
        />
      </div>

      {/* Levels Configuration */}
      <div>
        <Label>Learning Levels</Label>
        <div className="mt-2 space-y-4 max-h-96 overflow-y-auto">
          {formData.levels.map((level, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Level {level.levelNumber}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="questions">
                      Assessment Questions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={level.title}
                          onChange={(e) =>
                            updateLevel(index, "title", e.target.value)
                          }
                          placeholder="Level title"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Duration</Label>
                          <Input
                            type="number"
                            min="1"
                            value={level.timeframe}
                            onChange={(e) =>
                              updateLevel(
                                index,
                                "timeframe",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Select
                            value={level.timeframeUnit}
                            onValueChange={(value) =>
                              updateLevel(index, "timeframeUnit", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={TimeframeUnit.DAYS}>
                                Days
                              </SelectItem>
                              <SelectItem value={TimeframeUnit.WEEKS}>
                                Weeks
                              </SelectItem>
                              <SelectItem value={TimeframeUnit.MONTHS}>
                                Months
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={level.description}
                        onChange={(e) =>
                          updateLevel(index, "description", e.target.value)
                        }
                        placeholder="Level description"
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="questions" className="mt-4">
                    <AssessmentQuestionsTab
                      level={level}
                      levelIndex={index}
                      updateLevel={updateLevel}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? "Update Program" : "Create Program"}
        </Button>
      </div>
    </div>
  );
}

// View Program Details Component
interface ViewProgramDetailsProps {
  program: IProgram;
}

function ViewProgramDetails({ program }: ViewProgramDetailsProps) {
  const [timeLapseMatrix, setTimeLapseMatrix] = useState<number[][]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const fetchTimeLapseMatrix = useCallback(async () => {
    try {
      setLoadingMatrix(true);
      const response = await programsService.getProgramTimeLapseMatrix(
        program._id
      );
      setTimeLapseMatrix(response.timeLapseMatrix);
    } catch {
      toast.error("Failed to load time lapse matrix");
    } finally {
      setLoadingMatrix(false);
    }
  }, [program._id]);

  useEffect(() => {
    fetchTimeLapseMatrix();
  }, [fetchTimeLapseMatrix]);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="levels">Levels</TabsTrigger>
        <TabsTrigger value="questions">Questions</TabsTrigger>
        <TabsTrigger value="matrix">Time Matrix</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <p className="text-sm text-muted-foreground">{program.name}</p>
          </div>
          <div>
            <Label>Subject</Label>
            <p className="text-sm text-muted-foreground">{program.subject}</p>
          </div>
          <div>
            <Label>Total Levels</Label>
            <p className="text-sm text-muted-foreground">
              {program.totalLevels}
            </p>
          </div>
          <div>
            <Label>Status</Label>
            <Badge variant={program.isActive ? "default" : "secondary"}>
              {program.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <Label>Created By</Label>
            <p className="text-sm text-muted-foreground">
              {program.createdBy.name}
            </p>
          </div>
          <div>
            <Label>Created Date</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(program.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <p className="text-sm text-muted-foreground">{program.description}</p>
        </div>
      </TabsContent>

      <TabsContent value="levels" className="space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {program.levels.map((level) => (
            <Card key={level.levelNumber}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Level {level.levelNumber}: {level.title}
                </CardTitle>
                <CardDescription>
                  Duration: {level.timeframe} {level.timeframeUnit}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {level.description}
                </p>
                {level.prerequisites && level.prerequisites.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-xs">Prerequisites:</Label>
                    <div className="flex gap-1 mt-1">
                      {level.prerequisites.map((prereq) => (
                        <Badge
                          key={prereq}
                          variant="outline"
                          className="text-xs"
                        >
                          Level {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {level.assessmentQuestions &&
                  level.assessmentQuestions.length > 0 && (
                    <div className="mt-3">
                      <Label className="text-xs">Assessment Questions:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {level.assessmentQuestions.length} question(s) available
                        -
                        <span className="text-primary cursor-pointer hover:underline ml-1">
                          View in Questions tab
                        </span>
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="questions" className="space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {program.levels.filter(
            (level) =>
              level.assessmentQuestions && level.assessmentQuestions.length > 0
          ).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assessment questions found in any level.
            </div>
          ) : (
            <>
              {program.levels
                .filter(
                  (level) =>
                    level.assessmentQuestions &&
                    level.assessmentQuestions.length > 0
                )
                .map((level) => {
                  const questionsToShow = showAllQuestions
                    ? level.assessmentQuestions || []
                    : (level.assessmentQuestions || []).slice(0, 5);
                  const hasMoreQuestions =
                    (level.assessmentQuestions?.length || 0) > 5;

                  return (
                    <Card key={level.levelNumber}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Level {level.levelNumber}: {level.title}
                        </CardTitle>
                        <CardDescription>
                          {showAllQuestions
                            ? `All ${
                                level.assessmentQuestions?.length || 0
                              } Assessment Question(s)`
                            : `Showing ${Math.min(
                                5,
                                level.assessmentQuestions?.length || 0
                              )} of ${
                                level.assessmentQuestions?.length || 0
                              } Assessment Question(s)`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {questionsToShow.map((question, qIndex) => (
                            <div key={qIndex} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {question.questionType
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {question.points || 1} points
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Question {qIndex + 1}
                                </span>
                              </div>
                              <p className="font-medium mb-2">
                                {question.questionText}
                              </p>

                              {question.questionType === "multiple_choice" &&
                                question.options && (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                      Options:
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {question.options.map(
                                        (option, optIndex) => (
                                          <div
                                            key={optIndex}
                                            className="flex items-center gap-2"
                                          >
                                            <Badge
                                              variant={
                                                question.correctOptionIndex ===
                                                optIndex
                                                  ? "default"
                                                  : "outline"
                                              }
                                              className="text-xs"
                                            >
                                              {String.fromCharCode(
                                                65 + optIndex
                                              )}
                                            </Badge>
                                            <span className="text-sm">
                                              {option}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {question.questionType === "one_word_answer" &&
                                question.acceptedAnswers && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">
                                      Accepted Answers:
                                    </Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {question.acceptedAnswers.map(
                                        (answer, ansIndex) => (
                                          <Badge
                                            key={ansIndex}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {answer}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {question.questionType ===
                                "verbal_evaluation" && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Evaluation Type:
                                  </Label>
                                  <p className="text-sm mt-1 p-2 bg-muted rounded">
                                    Manual evaluation required by instructor
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {hasMoreQuestions && !showAllQuestions && (
                          <div className="mt-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAllQuestions(true)}
                              className="text-primary"
                            >
                              View All {level.assessmentQuestions?.length}{" "}
                              Questions
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              {showAllQuestions && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllQuestions(false)}
                    className="text-muted-foreground"
                  >
                    Show Less Questions
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="matrix" className="space-y-4">
        {loadingMatrix ? (
          <div className="text-center py-8">Loading time matrix...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr>
                  <th className="border border-gray-200 p-2 bg-gray-50">
                    From/To
                  </th>
                  {Array.from({ length: program.totalLevels }, (_, i) => (
                    <th
                      key={i}
                      className="border border-gray-200 p-2 bg-gray-50"
                    >
                      Level {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeLapseMatrix.map((row, fromIndex) => (
                  <tr key={fromIndex}>
                    <td className="border border-gray-200 p-2 bg-gray-50 font-medium">
                      Level {fromIndex + 1}
                    </td>
                    {row.map((time, toIndex) => (
                      <td
                        key={toIndex}
                        className="border border-gray-200 p-2 text-center"
                      >
                        {time === 0 ? "-" : `${time}w`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Assessment Questions Tab Component
interface AssessmentQuestionsTabProps {
  level: Omit<IProgramLevel, "_id">;
  levelIndex: number;
  updateLevel: (
    index: number,
    field: keyof IProgramLevel,
    value:
      | string
      | number
      | TimeframeUnit
      | number[]
      | string[]
      | IAssessmentQuestion[]
  ) => void;
}

function AssessmentQuestionsTab({
  level,
  levelIndex,
  updateLevel,
}: AssessmentQuestionsTabProps) {
  const [selectedQuestionType, setSelectedQuestionType] =
    useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [editingQuestion, setEditingQuestion] = useState<{
    index: number;
    question: IAssessmentQuestion;
  } | null>(null);

  const questions = level.assessmentQuestions || [];

  const addQuestion = () => {
    const newQuestion =
      programsService.createQuestionTemplate(selectedQuestionType);
    const updatedQuestions = [...questions, newQuestion];
    updateLevel(levelIndex, "assessmentQuestions", updatedQuestions);
  };

  const updateQuestion = (
    questionIndex: number,
    updatedQuestion: IAssessmentQuestion
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = updatedQuestion;
    updateLevel(levelIndex, "assessmentQuestions", updatedQuestions);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionIndex: number) => {
    const updatedQuestions = questions.filter(
      (_, index) => index !== questionIndex
    );
    updateLevel(levelIndex, "assessmentQuestions", updatedQuestions);
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return "Multiple Choice";
      case QuestionType.ONE_WORD_ANSWER:
        return "One Word Answer";
      case QuestionType.VERBAL_EVALUATION:
        return "Verbal Evaluation";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Question Section */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label htmlFor="questionType">Question Type</Label>
          <Select
            value={selectedQuestionType}
            onValueChange={(value) =>
              setSelectedQuestionType(value as QuestionType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                Multiple Choice
              </SelectItem>
              <SelectItem value={QuestionType.ONE_WORD_ANSWER}>
                One Word Answer
              </SelectItem>
              <SelectItem value={QuestionType.VERBAL_EVALUATION}>
                Verbal Evaluation
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No assessment questions added yet</p>
            <p className="text-sm">Add questions to assess student progress</p>
          </div>
        ) : (
          questions.map((question, questionIndex) => (
            <Card key={questionIndex} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                {editingQuestion?.index === questionIndex ? (
                  <QuestionEditor
                    question={editingQuestion.question}
                    onSave={(updatedQuestion) =>
                      updateQuestion(questionIndex, updatedQuestion)
                    }
                    onCancel={() => setEditingQuestion(null)}
                  />
                ) : (
                  <QuestionDisplay
                    question={question}
                    questionIndex={questionIndex}
                    onEdit={() =>
                      setEditingQuestion({ index: questionIndex, question })
                    }
                    onDelete={() => deleteQuestion(questionIndex)}
                    getQuestionTypeLabel={getQuestionTypeLabel}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Question Display Component
interface QuestionDisplayProps {
  question: IAssessmentQuestion;
  questionIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  getQuestionTypeLabel: (type: QuestionType) => string;
}

function QuestionDisplay({
  question,
  questionIndex,
  onEdit,
  onDelete,
  getQuestionTypeLabel,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">
              {getQuestionTypeLabel(question.questionType)}
            </Badge>
            <Badge variant="secondary">
              {question.points || 1} point
              {(question.points || 1) !== 1 ? "s" : ""}
            </Badge>
            {question.isRequired && (
              <Badge variant="destructive">Required</Badge>
            )}
          </div>
          <p className="font-medium text-gray-900 mb-2">
            Q{questionIndex + 1}:{" "}
            {question.questionText || "Question text not set"}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Question Type Specific Display */}
      {question.questionType === QuestionType.MULTIPLE_CHOICE &&
        question.options && (
          <div className="ml-4 space-y-1">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    question.correctOptionIndex === index
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span
                  className={
                    question.correctOptionIndex === index
                      ? "font-medium text-green-700"
                      : "text-gray-600"
                  }
                >
                  {option || `Option ${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}

      {question.questionType === QuestionType.ONE_WORD_ANSWER &&
        question.acceptedAnswers && (
          <div className="ml-4">
            <p className="text-sm text-gray-600">Accepted Answers:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {question.acceptedAnswers.map((answer, index) => (
                <Badge key={index} variant="outline">
                  {answer}
                </Badge>
              ))}
            </div>
          </div>
        )}

      {question.questionType === QuestionType.VERBAL_EVALUATION && (
        <div className="ml-4">
          <p className="text-sm text-gray-600">
            This question will be evaluated manually by the instructor.
          </p>
        </div>
      )}
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: IAssessmentQuestion;
  onSave: (question: IAssessmentQuestion) => void;
  onCancel: () => void;
}

function QuestionEditor({
  question: initialQuestion,
  onSave,
  onCancel,
}: QuestionEditorProps) {
  const [question, setQuestion] =
    useState<IAssessmentQuestion>(initialQuestion);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const validationErrors = programsService.validateQuestion(question);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    onSave(question);
  };

  const updateQuestion = (
    field: keyof IAssessmentQuestion,
    value: string | number | boolean | string[] | number[] | QuestionType
  ) => {
    setQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || ["", "", "", ""])];
    newOptions[index] = value;
    updateQuestion("options", newOptions);
  };

  const updateAcceptedAnswer = (index: number, value: string) => {
    const newAnswers = [...(question.acceptedAnswers || [""])];
    newAnswers[index] = value;
    updateQuestion("acceptedAnswers", newAnswers);
  };

  const addAcceptedAnswer = () => {
    const newAnswers = [...(question.acceptedAnswers || []), ""];
    updateQuestion("acceptedAnswers", newAnswers);
  };

  const removeAcceptedAnswer = (index: number) => {
    const newAnswers = (question.acceptedAnswers || []).filter(
      (_, i) => i !== index
    );
    updateQuestion("acceptedAnswers", newAnswers);
  };

  return (
    <div className="space-y-4">
      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <AlertCircle className="h-4 w-4" />
            Please fix the following errors:
          </div>
          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Question Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="questionText">Question Text</Label>
          <Textarea
            id="questionText"
            value={question.questionText}
            onChange={(e) => updateQuestion("questionText", e.target.value)}
            placeholder="Enter your question here..."
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="points">Points</Label>
          <Input
            id="points"
            type="number"
            min="0"
            value={question.points || 1}
            onChange={(e) =>
              updateQuestion("points", parseInt(e.target.value) || 1)
            }
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="isRequired"
            checked={question.isRequired}
            onChange={(e) => updateQuestion("isRequired", e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="isRequired">Required Question</Label>
        </div>
      </div>

      {/* Question Type Specific Fields */}
      {question.questionType === QuestionType.MULTIPLE_CHOICE && (
        <div className="space-y-3">
          <Label>Answer Options</Label>
          {(question.options || ["", "", "", ""]).map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctOption"
                checked={question.correctOptionIndex === index}
                onChange={() => updateQuestion("correctOptionIndex", index)}
                className="mt-1"
              />
              <div className="flex-1">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
              </div>
            </div>
          ))}
          <p className="text-sm text-gray-600">
            Select the radio button next to the correct answer
          </p>
        </div>
      )}

      {question.questionType === QuestionType.ONE_WORD_ANSWER && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Accepted Answers</Label>
            <Button variant="outline" size="sm" onClick={addAcceptedAnswer}>
              <Plus className="h-4 w-4 mr-1" />
              Add Answer
            </Button>
          </div>
          {(question.acceptedAnswers || [""]).map((answer, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={answer}
                  onChange={(e) => updateAcceptedAnswer(index, e.target.value)}
                  placeholder={`Accepted answer ${index + 1}`}
                />
              </div>
              {(question.acceptedAnswers || []).length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAcceptedAnswer(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <p className="text-sm text-gray-600">
            Add multiple acceptable answers (case-insensitive)
          </p>
        </div>
      )}

      {question.questionType === QuestionType.VERBAL_EVALUATION && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-blue-800 text-sm">
            <strong>Verbal Evaluation:</strong> This question will be presented
            to an evaluator who will manually assess the student's response and
            mark it as correct or incorrect.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Question</Button>
      </div>
    </div>
  );
}

// Import Program Dialog Component
interface ImportProgramDialogProps {
  onImport: (file: File) => void;
}

function ImportProgramDialog({ onImport }: ImportProgramDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === "application/json" || file.name.endsWith(".json")) {
      setSelectedFile(file);
    } else {
      toast.error("Please select a valid JSON file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {selectedFile
                ? selectedFile.name
                : "Drop JSON file here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a program JSON file with levels and questions
            </p>
          </div>
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="json-file-input"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("json-file-input")?.click()}
          >
            Browse Files
          </Button>
        </div>
      </div>

      {selectedFile && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700 font-medium mb-2">
          Supported JSON Formats:
        </p>
        <div className="text-xs text-blue-600 space-y-2">
          <div>
            <p className="font-medium">Simple Format:</p>
            <ul className="ml-2 space-y-1">
              <li>• programName, subject, description</li>
              <li>
                • questionSets: [{"{"} level: 1, type: "verbal", questions:
                ["अ", "आ", ...] {"}"}]
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Full Format:</p>
            <ul className="ml-2 space-y-1">
              <li>• programName, subject, description</li>
              <li>
                • levels: Array with detailed level configuration and
                assessmentQuestions
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setSelectedFile(null)}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!selectedFile}>
          Import Program
        </Button>
      </div>
    </div>
  );
}

export default ManagePrograms;
