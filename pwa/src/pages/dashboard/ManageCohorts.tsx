import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCohort,
  deleteCohort,
  getCohorts,
  updateCohort,
  generateOptimalCohorts,
  previewOptimalCohorts,
  createCohortsFromPlan,
  type Cohort,
  type CreateCohortDTO,
  type UpdateCohortDTO,
  type PreviewCohort,
} from "@/services/cohorts";
import { getSchools } from "@/services/schools";
import { getTutors } from "@/services/tutors";
import { getStudents, getStudentCohortStatus } from "@/services/students";
import { programsService } from "@/services/programs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  Users,
  AlertCircle,
  CheckCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

function ManageCohorts() {
  const { selectedSchool } = useSchoolContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [deletingCohort, setDeletingCohort] = useState<Cohort | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [editableCohorts, setEditableCohorts] = useState<PreviewCohort[]>([]);
  const [generationStrategy, setGenerationStrategy] = useState<
    "high-first" | "low-first"
  >("low-first");
  const [totalMaxCohorts, setTotalMaxCohorts] = useState<number>(5);
  const [programCohortConfigs, setProgramCohortConfigs] = useState<
    Record<string, number>
  >({});
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(
    new Set()
  );
  const [formData, setFormData] = useState<CreateCohortDTO>({
    name: "",
    schoolId: "",
    tutorId: "",
    students: [],
  });

  const queryClient = useQueryClient();

  // Fetch cohorts filtered by selected school
  const { data: cohorts, isLoading: isLoadingCohorts } = useQuery({
    queryKey: ["cohorts", selectedSchool?._id],
    queryFn: () => getCohorts(selectedSchool?._id),
    enabled: !!selectedSchool?._id,
  });

  // Fetch all schools, tutors, students for dropdowns
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  const { data: allTutors = [] } = useQuery({
    queryKey: ["tutors"],
    queryFn: () => getTutors(),
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  });

  // Fetch student cohort status for the selected school
  const { data: cohortStatus } = useQuery({
    queryKey: ["student-cohort-status", selectedSchool?._id],
    queryFn: () =>
      selectedSchool?._id
        ? getStudentCohortStatus(selectedSchool._id)
        : Promise.resolve(undefined),
    enabled: !!selectedSchool?._id,
  });

  // Fetch programs for cohort generation
  const { data: programsResponse } = useQuery({
    queryKey: ["programs"],
    queryFn: () => programsService.getPrograms({ isActive: "true" }),
  });

  const programs = useMemo(
    () => programsResponse?.programs || [],
    [programsResponse?.programs]
  );

  // Filter students and tutors based on selected school
  const filteredTutors = allTutors.filter(
    (tutor) => tutor.schoolId?._id === selectedSchool?._id
  );

  const filteredStudents = allStudents.filter(
    (student) => student.schoolId?._id === selectedSchool?._id
  );

  // Filter cohorts to show only those from the selected school (additional safety filter)
  const filteredCohorts =
    cohorts?.filter((cohort) => {
      const cohortSchoolId =
        typeof cohort.schoolId === "string"
          ? cohort.schoolId
          : cohort.schoolId?._id;
      return cohortSchoolId === selectedSchool?._id;
    }) || [];

  // Create cohort mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCohortDTO) => createCohort(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-progress-summary"] });
      handleCloseDialog();
      toast.success("Cohort created successfully");
    },
    onError: () => {
      toast.error("Failed to create cohort");
    },
  });

  // Update cohort mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCohortDTO }) =>
      updateCohort(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      handleCloseDialog();
      toast.success("Cohort updated successfully");
    },
    onError: () => {
      toast.error("Failed to update cohort");
    },
  });

  // Delete cohort mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCohort,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      setIsDeleteDialogOpen(false);
      toast.success("Cohort deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete cohort");
    },
  });

  // Preview cohorts mutation
  const previewCohortsMutation = useMutation({
    mutationFn: previewOptimalCohorts,
    onSuccess: (data) => {
      setEditableCohorts(data.previewCohorts.map((c) => ({ ...c }))); // Deep copy for editing
      setIsGenerateModalOpen(false);
      setIsApprovalModalOpen(true);
      setIsGenerating(false);
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to preview cohorts";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { error?: string } } };
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setIsGenerating(false);
      toast.error(errorMessage);
    },
  });

  // Create cohorts from approved plan mutation
  const createFromPlanMutation = useMutation({
    mutationFn: createCohortsFromPlan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["student-cohort-status"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-progress-summary"] });
      setIsApprovalModalOpen(false);
      setIsGenerating(false);
      toast.success(
        `Successfully created ${data.cohorts.length} cohorts for ${data.studentsAssigned} students!`
      );
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to create cohorts";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { error?: string } } };
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setIsGenerating(false);
      toast.error(errorMessage);
    },
  });

  // Generate optimal cohorts mutation (kept for backward compatibility)
  const generateCohortsMutation = useMutation({
    mutationFn: generateOptimalCohorts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["cohorts", selectedSchool?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["student-cohort-status"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      // Invalidate attendance and progress queries so new cohorts show up immediately
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-progress-summary"] });
      setIsGenerating(false);

      const pendingMsg =
        data.totalPendingStudents > 0
          ? ` ${data.totalPendingStudents} students are pending for later assignment.`
          : "";

      toast.success(
        `Successfully generated ${data.cohorts.length} active cohorts across ${data.programsProcessed} programs for ${data.studentsAssigned} students!${pendingMsg}`
      );
    },
    onError: (error: unknown) => {
      let errorMessage = "Failed to generate cohorts";

      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { error?: string } } };
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setIsGenerating(false);
      toast.error(errorMessage);
    },
  });

  const handleSubmit = () => {
    if (editingCohort) {
      const { name, tutorId, students } = formData;
      updateMutation.mutate({
        id: editingCohort._id,
        data: { name, tutorId, students },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort);
    const schoolIdValue =
      typeof cohort.schoolId === "string"
        ? cohort.schoolId
        : cohort.schoolId._id;
    const tutorIdValue = cohort.tutorId
      ? typeof cohort.tutorId === "string"
        ? cohort.tutorId
        : cohort.tutorId._id
      : undefined;
    setFormData({
      name: cohort.name,
      schoolId: schoolIdValue,
      tutorId: tutorIdValue,
      students: cohort.students,
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingCohort(null);
    setFormData({
      name: "",
      schoolId: selectedSchool?._id || "",
      tutorId: "",
      students: [],
    });
  };

  const handleDelete = async () => {
    if (!deletingCohort?._id) return;
    await deleteMutation.mutateAsync(deletingCohort._id);
  };

  // Get programs with assessed students
  const programsWithAssessments = useMemo(() => {
    if (!allStudents || allStudents.length === 0) return [];

    return programs.filter((program) => {
      return allStudents.some((student) => {
        if (!student.knowledgeLevel || student.knowledgeLevel.length === 0)
          return false;
        return student.knowledgeLevel.some(
          (kl) => kl.program && kl.program.toString() === program._id
        );
      });
    });
  }, [programs, allStudents]);

  // Auto-distribute cohorts when total changes
  const distributeCohorts = useCallback(
    (configs: Record<string, number>, selected: Set<string>, total: number) => {
      const selectedArray = Array.from(selected);
      if (selectedArray.length === 0 || total === 0) {
        setProgramCohortConfigs(configs);
        return;
      }

      const perProgram = Math.floor(total / selectedArray.length);
      const remainder = total % selectedArray.length;
      const newConfigs = { ...configs };

      selectedArray.forEach((programId, index) => {
        newConfigs[programId] = perProgram + (index < remainder ? 1 : 0);
      });

      setProgramCohortConfigs(newConfigs);
    },
    []
  );

  // Initialize program configs when modal opens
  useEffect(() => {
    if (isGenerateModalOpen && programsWithAssessments.length > 0) {
      const initialConfigs: Record<string, number> = {};
      const initialSelected = new Set<string>();

      programsWithAssessments.forEach((program) => {
        initialConfigs[program._id] = 0;
        initialSelected.add(program._id);
      });

      setProgramCohortConfigs(initialConfigs);
      setSelectedPrograms(initialSelected);

      // Auto-distribute total max cohorts
      if (totalMaxCohorts > 0) {
        distributeCohorts(initialConfigs, initialSelected, totalMaxCohorts);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerateModalOpen, programsWithAssessments.length, totalMaxCohorts]);

  // Handle total max cohorts change
  const handleTotalMaxCohortsChange = (value: number) => {
    setTotalMaxCohorts(value);
    if (value > 0 && selectedPrograms.size > 0) {
      distributeCohorts(programCohortConfigs, selectedPrograms, value);
    }
  };

  // Handle individual program cohort count change
  const handleProgramCohortChange = (programId: string, value: number) => {
    const newConfigs = { ...programCohortConfigs };
    newConfigs[programId] = Math.max(0, value);

    // Recalculate total
    const newTotal = Object.values(newConfigs).reduce(
      (sum, count) => sum + count,
      0
    );
    setTotalMaxCohorts(newTotal);

    // Redistribute remaining to other selected programs
    const remaining = newTotal - newConfigs[programId];
    const otherPrograms = Array.from(selectedPrograms).filter(
      (id) => id !== programId
    );

    if (otherPrograms.length > 0 && remaining > 0) {
      const perOther = Math.floor(remaining / otherPrograms.length);
      const remainder = remaining % otherPrograms.length;

      otherPrograms.forEach((id, index) => {
        newConfigs[id] = perOther + (index < remainder ? 1 : 0);
      });
    } else if (otherPrograms.length > 0) {
      otherPrograms.forEach((id) => {
        newConfigs[id] = 0;
      });
    }

    setProgramCohortConfigs(newConfigs);
  };

  // Handle program selection toggle
  const handleProgramToggle = (programId: string, checked: boolean) => {
    const newSelected = new Set(selectedPrograms);
    if (checked) {
      newSelected.add(programId);
      if (!programCohortConfigs[programId]) {
        programCohortConfigs[programId] = 0;
      }
    } else {
      newSelected.delete(programId);
      delete programCohortConfigs[programId];
    }

    setSelectedPrograms(newSelected);

    // Redistribute cohorts among selected programs
    if (totalMaxCohorts > 0 && newSelected.size > 0) {
      distributeCohorts(programCohortConfigs, newSelected, totalMaxCohorts);
    }
  };

  const handleGenerateCohorts = async () => {
    if (!selectedSchool?._id) {
      toast.error("No school selected");
      return;
    }

    if (selectedPrograms.size === 0) {
      toast.error("Please select at least one program");
      return;
    }

    const programsToGenerate = Array.from(selectedPrograms)
      .map((programId) => ({
        programId,
        maxCohorts: programCohortConfigs[programId] || 0,
      }))
      .filter((p) => p.maxCohorts > 0);

    if (programsToGenerate.length === 0) {
      toast.error("Please set cohort counts for at least one program");
      return;
    }

    setIsGenerating(true);

    // Call preview endpoint instead of generating directly
    previewCohortsMutation.mutate({
      schoolId: selectedSchool._id,
      strategy: generationStrategy,
      capacityLimit: totalMaxCohorts,
      programs: programsToGenerate,
    });
  };

  const handleApproveCohorts = () => {
    if (!selectedSchool?._id) {
      toast.error("No school selected");
      return;
    }

    if (editableCohorts.length === 0) {
      toast.error("No cohorts to create");
      return;
    }

    setIsGenerating(true);

    // Prepare cohorts for creation
    const cohortsToCreate = editableCohorts.map((cohort) => ({
      name: cohort.name,
      programId: cohort.programId,
      currentLevel: cohort.currentLevel,
      tutorId: cohort.tutorId || null,
      students: cohort.students,
    }));

    createFromPlanMutation.mutate({
      schoolId: selectedSchool._id,
      cohorts: cohortsToCreate,
    });
  };

  const handleStudentChange = (studentId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      students: checked
        ? [...prev.students, studentId]
        : prev.students.filter((id) => id !== studentId),
    }));
  };

  const getSchoolName = (schoolId: string) => {
    return schools.find((school) => school._id === schoolId)?.name || schoolId;
  };

  const getTutorName = (tutorId: string | undefined | null) => {
    if (!tutorId) return "No tutor assigned";
    return allTutors.find((tutor) => tutor.id === tutorId)?.name || tutorId;
  };

  const getStudentName = (studentId: string) => {
    return (
      allStudents.find((student) => student._id === studentId)?.name ||
      studentId
    );
  };

  if (isLoadingCohorts) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedSchool) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 mb-4 text-muted-foreground">
            <Users className="w-24 h-24" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No School Selected</h3>
          <p className="text-muted-foreground mb-4">
            Please select a school from the sidebar to manage cohorts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Cohorts</h1>
          <p className="text-muted-foreground">
            Create and manage student cohorts
            {selectedSchool && (
              <span className="ml-2 text-primary font-medium">
                • {selectedSchool.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {cohortStatus && cohortStatus.studentsAwaitingAssignment > 0 && (
            <Button
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={isGenerating || programsWithAssessments.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : `Generate Cohorts`}
            </Button>
          )}
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cohort
          </Button>
        </div>
      </div>

      {/* Cohort Status Indicator */}
      {selectedSchool && cohortStatus && (
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cohortStatus.studentsAwaitingAssignment > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-yellow-700">
                    {cohortStatus.studentsAwaitingAssignment} students awaiting
                    cohort assignment
                  </span>
                </div>
              ) : cohortStatus.studentsWithAssessments > 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">
                    All students are assigned to cohorts
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-600">
                    No students with assessments found
                  </span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {cohortStatus.studentsInCohorts}/
              {cohortStatus.studentsWithAssessments} assigned
            </div>
          </div>

          {cohortStatus.studentsAwaitingAssignment > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>💡 Recommendation:</strong> Use automated cohort
                generation for most efficient grouping. Our algorithm creates
                optimal cohorts based on assessment levels and your capacity
                limit. Choose a strategy (Low First or High First) and set the
                maximum number of active cohorts you can teach simultaneously.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pending Students Display */}
      {generateCohortsMutation.data &&
        generateCohortsMutation.data.totalPendingStudents > 0 && (
          <div className="mb-6 p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">
                  Pending Students (
                  {generateCohortsMutation.data.totalPendingStudents})
                </h3>
              </div>
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-700"
              >
                Will be assigned after active cohorts complete
              </Badge>
            </div>
            <p className="text-sm text-orange-800 mb-3">
              These students have been assessed but are not yet assigned to
              cohorts due to capacity constraints. They will be available for
              cohort creation once the current active cohorts are completed.
            </p>
            <div className="space-y-3">
              {/* Group by program */}
              {generateCohortsMutation.data.pendingStudents &&
                Array.from(
                  new Set(
                    generateCohortsMutation.data.pendingStudents.map(
                      (p) => p.program
                    )
                  )
                ).map((programName) => {
                  const programPending =
                    generateCohortsMutation.data.pendingStudents.filter(
                      (p) => p.program === programName
                    );
                  return (
                    <div
                      key={programName}
                      className="bg-white rounded-md p-3 border border-orange-200"
                    >
                      <div className="font-semibold text-orange-800 mb-2">
                        {programName}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {programPending.map((pending, idx) => (
                          <div key={idx} className="text-center">
                            <div className="text-base font-bold text-orange-700">
                              Level {pending.level}
                            </div>
                            <div className="text-xs text-orange-600">
                              {pending.students} students
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Program Results Summary */}
            {generateCohortsMutation.data.programResults &&
              generateCohortsMutation.data.programResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-orange-300">
                  <h4 className="text-sm font-semibold text-orange-900 mb-2">
                    Generation Summary by Program:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {generateCohortsMutation.data.programResults.map(
                      (result, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded p-2 border border-orange-200"
                        >
                          <div className="font-medium text-sm text-orange-800">
                            {result.programSubject.toUpperCase()}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            {result.cohortsCreated} cohorts •{" "}
                            {result.studentsAssigned} students •{" "}
                            {result.pendingStudents} pending
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCohorts?.map((cohort) => (
              <TableRow key={cohort._id}>
                <TableCell>{cohort.name}</TableCell>
                <TableCell>
                  {getSchoolName(
                    typeof cohort.schoolId === "string"
                      ? cohort.schoolId
                      : cohort.schoolId?._id
                  )}
                </TableCell>
                <TableCell>
                  {getTutorName(
                    cohort.tutorId
                      ? typeof cohort.tutorId === "string"
                        ? cohort.tutorId
                        : cohort.tutorId._id
                      : null
                  )}
                </TableCell>
                <TableCell>
                  {Array.isArray(cohort.students)
                    ? cohort.students
                        .map((sid) => getStudentName(sid))
                        .join(", ")
                    : ""}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cohort)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/progress/cohort/${cohort._id}`)
                      }
                      title="View Progress"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingCohort(cohort);
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

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCohort ? "Edit Cohort" : "Create Cohort"}
            </DialogTitle>
            <DialogDescription>
              {editingCohort
                ? "Update the cohort's information below"
                : "Fill in the details to create a new cohort for the selected school"}
            </DialogDescription>
          </DialogHeader>
          {selectedSchool && !editingCohort && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-sm text-blue-700">
                Creating cohort for: <strong>{selectedSchool.name}</strong>
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Cohort Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tutorId">Tutor (Optional)</Label>
              <Select
                value={formData.tutorId || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    tutorId: value === "none" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tutor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (No tutor assigned)</SelectItem>
                  {filteredTutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Students</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={student._id}
                        checked={formData.students.includes(student._id)}
                        onCheckedChange={(checked) =>
                          handleStudentChange(student._id, checked as boolean)
                        }
                      />
                      <Label htmlFor={student._id} className="text-sm">
                        {student.name}
                      </Label>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No students found for selected school
                    </p>
                  )}
                </div>
              </ScrollArea>
              {formData.students.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.students.length} student(s)
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.students.map((studentId) => (
                      <Badge
                        key={studentId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {getStudentName(studentId)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
              {editingCohort ? "Update" : "Create"}
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
              cohort "{deletingCohort?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Cohorts Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Cohorts</DialogTitle>
            <DialogDescription>
              Select programs and configure cohort generation settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Strategy Selection */}
            <div className="space-y-2">
              <Label htmlFor="strategy">Generation Strategy</Label>
              <Select
                value={generationStrategy}
                onValueChange={(value: "high-first" | "low-first") =>
                  setGenerationStrategy(value)
                }
              >
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low-first">
                    Low First (Start with lower levels)
                  </SelectItem>
                  <SelectItem value="high-first">
                    High First (Start with higher levels)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {generationStrategy === "low-first"
                  ? "Creates cohorts starting from the lowest assessment levels first"
                  : "Creates cohorts starting from the highest assessment levels first"}
              </p>
            </div>

            {/* Total Max Cohorts */}
            <div className="space-y-2">
              <Label htmlFor="totalMaxCohorts">Total Maximum Cohorts</Label>
              <Input
                id="totalMaxCohorts"
                type="number"
                min="1"
                max="50"
                value={totalMaxCohorts}
                onChange={(e) =>
                  handleTotalMaxCohortsChange(parseInt(e.target.value) || 0)
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Total number of cohorts to generate across all selected
                programs. This will be automatically distributed.
              </p>
            </div>

            {/* Program Selection and Configuration */}
            <div className="space-y-4">
              <Label>Programs with Assessed Students</Label>
              {programsWithAssessments.length === 0 ? (
                <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                  No programs with assessed students found. Please conduct
                  baseline assessments first.
                </div>
              ) : (
                <div className="space-y-3 border rounded-md p-4">
                  {programsWithAssessments.map((program) => {
                    const isSelected = selectedPrograms.has(program._id);
                    const cohortCount = programCohortConfigs[program._id] || 0;
                    const awaitingCount = allStudents.filter((student) => {
                      if (
                        !student.knowledgeLevel ||
                        student.knowledgeLevel.length === 0
                      )
                        return false;
                      const hasProgramAssessment = student.knowledgeLevel.some(
                        (kl) =>
                          kl.program && kl.program.toString() === program._id
                      );
                      if (!hasProgramAssessment) return false;
                      // Check if student is not in active cohort
                      const schoolId =
                        typeof student.schoolId === "string"
                          ? student.schoolId
                          : student.schoolId?._id;
                      return schoolId === selectedSchool?._id;
                    }).length;

                    return (
                      <div
                        key={program._id}
                        className={`p-3 border rounded-md ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleProgramToggle(
                                program._id,
                                checked as boolean
                              )
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  {program.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {program.subject} • {awaitingCount} students
                                  awaiting
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2 mt-2">
                                <Label
                                  htmlFor={`cohorts-${program._id}`}
                                  className="text-sm"
                                >
                                  Max Cohorts:
                                </Label>
                                <Input
                                  id={`cohorts-${program._id}`}
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={cohortCount}
                                  onChange={(e) =>
                                    handleProgramCohortChange(
                                      program._id,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-24"
                                  disabled={!isSelected}
                                />
                                <span className="text-xs text-muted-foreground">
                                  (Auto-calculated from total)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedPrograms.size > 0 && (
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm font-medium mb-2">Summary</div>
                <div className="text-sm space-y-1">
                  <div>Selected Programs: {selectedPrograms.size}</div>
                  <div>Total Cohorts: {totalMaxCohorts}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Cohorts will be distributed across selected programs based
                    on student distribution.
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateCohorts}
              disabled={
                isGenerating ||
                selectedPrograms.size === 0 ||
                totalMaxCohorts === 0 ||
                programsWithAssessments.length === 0
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Cohorts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review and Approve Cohorts</DialogTitle>
            <DialogDescription>
              Review the generated cohorts. You can edit names, reassign
              students, and change tutors before approving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editableCohorts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No cohorts to review
              </div>
            ) : (
              // Group cohorts by program
              (() => {
                const groupedByProgram: Record<string, PreviewCohort[]> = {};
                editableCohorts.forEach((cohort) => {
                  const key = cohort.programId;
                  if (!groupedByProgram[key]) {
                    groupedByProgram[key] = [];
                  }
                  groupedByProgram[key].push(cohort);
                });

                return Object.entries(groupedByProgram).map(
                  ([programId, cohorts]) => {
                    const program = programs.find((p) => p._id === programId);
                    const programName =
                      cohorts[0]?.programName ||
                      program?.name ||
                      "Unknown Program";

                    return (
                      <div
                        key={programId}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">
                            {programName}
                          </h3>
                          <Badge variant="outline">
                            {cohorts.length} cohort
                            {cohorts.length > 1 ? "s" : ""}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {cohorts.map((cohort) => {
                            const globalIndex = editableCohorts.findIndex(
                              (c) =>
                                c.programId === cohort.programId &&
                                c.name === cohort.name &&
                                c.currentLevel === cohort.currentLevel
                            );

                            return (
                              <div
                                key={globalIndex}
                                className="border rounded-md p-4 bg-gray-50 space-y-3"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Cohort Name */}
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`cohort-name-${globalIndex}`}
                                    >
                                      Cohort Name
                                    </Label>
                                    <Input
                                      id={`cohort-name-${globalIndex}`}
                                      value={cohort.name}
                                      onChange={(e) => {
                                        const updated = [...editableCohorts];
                                        updated[globalIndex].name =
                                          e.target.value;
                                        setEditableCohorts(updated);
                                      }}
                                    />
                                  </div>

                                  {/* Tutor Assignment */}
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor={`cohort-tutor-${globalIndex}`}
                                    >
                                      Tutor
                                    </Label>
                                    <Select
                                      value={cohort.tutorId || "none"}
                                      onValueChange={(value) => {
                                        const updated = [...editableCohorts];
                                        const tutor = filteredTutors.find(
                                          (t) => t.id === value
                                        );
                                        updated[globalIndex].tutorId =
                                          value === "none" ? null : value;
                                        updated[globalIndex].tutorName =
                                          tutor?.name || null;
                                        setEditableCohorts(updated);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select tutor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          None (No tutor assigned)
                                        </SelectItem>
                                        {filteredTutors.map((tutor) => (
                                          <SelectItem
                                            key={tutor.id}
                                            value={tutor.id}
                                          >
                                            {tutor.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Level and Program Info */}
                                <div className="flex gap-2">
                                  <Badge variant="secondary">
                                    Level {cohort.currentLevel}
                                  </Badge>
                                  <Badge variant="outline">
                                    {cohort.students.length} students
                                  </Badge>
                                </div>

                                {/* Students List - Editable */}
                                <div className="space-y-2">
                                  <Label>
                                    Students ({cohort.students.length})
                                  </Label>
                                  <ScrollArea className="h-32 border rounded-md p-2">
                                    <div className="space-y-2">
                                      {cohort.students.map(
                                        (studentId, studentIdx) => {
                                          const student = allStudents.find(
                                            (s) => s._id === studentId
                                          );
                                          const studentName =
                                            student?.name ||
                                            cohort.studentNames[studentIdx] ||
                                            studentId;

                                          // Find other cohorts in the same program and level where this student could be moved
                                          const otherCohorts = editableCohorts
                                            .map((c, idx) => ({
                                              cohort: c,
                                              index: idx,
                                            }))
                                            .filter(
                                              ({ cohort: c, index }) =>
                                                index !== globalIndex &&
                                                c.programId ===
                                                  cohort.programId &&
                                                c.currentLevel ===
                                                  cohort.currentLevel
                                            );

                                          return (
                                            <div
                                              key={studentId}
                                              className="flex items-center justify-between p-2 bg-white rounded border"
                                            >
                                              <span className="text-sm flex-1">
                                                {studentName}
                                              </span>
                                              {otherCohorts.length > 0 && (
                                                <Select
                                                  value=""
                                                  onValueChange={(
                                                    targetCohortIdxStr
                                                  ) => {
                                                    const targetCohortIdx =
                                                      parseInt(
                                                        targetCohortIdxStr
                                                      );
                                                    const updated =
                                                      editableCohorts.map(
                                                        (c) => ({ ...c })
                                                      );

                                                    // Find student name index in current cohort
                                                    const currentCohort =
                                                      updated[globalIndex];
                                                    const studentNameIdx =
                                                      currentCohort.students.findIndex(
                                                        (id) => id === studentId
                                                      );
                                                    const nameToMove =
                                                      studentNameIdx >= 0 &&
                                                      studentNameIdx <
                                                        currentCohort
                                                          .studentNames.length
                                                        ? currentCohort
                                                            .studentNames[
                                                            studentNameIdx
                                                          ]
                                                        : studentName;

                                                    // Remove from current cohort
                                                    updated[globalIndex] = {
                                                      ...currentCohort,
                                                      students:
                                                        currentCohort.students.filter(
                                                          (id) =>
                                                            id !== studentId
                                                        ),
                                                      studentNames:
                                                        currentCohort.studentNames.filter(
                                                          (_, idx) =>
                                                            idx !==
                                                            studentNameIdx
                                                        ),
                                                    };

                                                    // Add to target cohort
                                                    updated[targetCohortIdx] = {
                                                      ...updated[
                                                        targetCohortIdx
                                                      ],
                                                      students: [
                                                        ...updated[
                                                          targetCohortIdx
                                                        ].students,
                                                        studentId,
                                                      ],
                                                      studentNames: [
                                                        ...updated[
                                                          targetCohortIdx
                                                        ].studentNames,
                                                        nameToMove,
                                                      ],
                                                    };

                                                    setEditableCohorts(updated);
                                                  }}
                                                >
                                                  <SelectTrigger className="w-40 h-8">
                                                    <SelectValue placeholder="Move to..." />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {otherCohorts.map(
                                                      ({
                                                        cohort: otherCohort,
                                                        index: otherIdx,
                                                      }) => (
                                                        <SelectItem
                                                          key={otherIdx}
                                                          value={otherIdx.toString()}
                                                        >
                                                          {otherCohort.name}
                                                        </SelectItem>
                                                      )
                                                    )}
                                                  </SelectContent>
                                                </Select>
                                              )}
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </ScrollArea>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                );
              })()
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApprovalModalOpen(false);
                setEditableCohorts([]);
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveCohorts}
              disabled={isGenerating || editableCohorts.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Create Cohorts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ManageCohorts;
