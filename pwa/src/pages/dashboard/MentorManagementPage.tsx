"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Users,
  Star,
  TrendingUp,
  Calendar,
  BookOpen,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSchools } from "@/services/schools";
import {
  getMentorProfiles,
  getMentorStatistics,
  createMentorProfile,
  addPerformanceMetric,
  assignToMentor,
  addFeedback,
  type MentorProfile,
  type Specialization,
  type WorkType,
  type MentorStatus,
  type CreateMentorProfileRequest,
  type PerformanceMetricRequest,
  type AssignmentRequest,
  type FeedbackRequest,
  getWorkTypeLabel,
  getSpecializationLabel,
  getStatusColor,
  getWorkloadColor,
} from "@/services/mentorProfiles";

export default function MentorManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [filterSpecialization, setFilterSpecialization] = useState<
    Specialization | "all"
  >("all");
  const [filterStatus, setFilterStatus] = useState<MentorStatus | "all">("all");
  const [filterWorkType, setFilterWorkType] = useState<WorkType | "all">("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("overview");

  // Modal states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState<CreateMentorProfileRequest>({
    userId: "",
    professionalInfo: {
      position: "Mentor",
      workType: "full_time",
      specializations: ["general"],
      maxStudents: 20,
    },
  });

  const [performanceForm, setPerformanceForm] =
    useState<PerformanceMetricRequest>({
      period: "",
      studentsAssigned: 0,
      averageStudentImprovement: 0,
      attendanceRate: 0,
      assessmentCompletionRate: 0,
    });

  const [assignmentForm, setAssignmentForm] = useState<AssignmentRequest>({
    type: "student",
    targetId: "",
    targetName: "",
    priority: "medium",
  });

  const [feedbackForm, setFeedbackForm] = useState<FeedbackRequest>({
    type: "admin",
    rating: 5,
  });

  // Fetch schools
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Fetch mentor profiles
  const { data: mentorData, isLoading: isLoadingMentors } = useQuery({
    queryKey: [
      "mentorProfiles",
      selectedSchool,
      filterSpecialization,
      filterStatus,
      filterWorkType,
      showAvailableOnly,
    ],
    queryFn: () =>
      getMentorProfiles({
        schoolId: selectedSchool || undefined,
        specialization:
          filterSpecialization === "all" ? undefined : filterSpecialization,
        status: filterStatus === "all" ? undefined : filterStatus,
        workType: filterWorkType === "all" ? undefined : filterWorkType,
        available: showAvailableOnly || undefined,
        page: 1,
        limit: 50,
      }),
    enabled: !!selectedSchool,
  });

  // Fetch mentor statistics
  const { data: mentorStats } = useQuery({
    queryKey: ["mentorStatistics", selectedSchool],
    queryFn: () => getMentorStatistics(selectedSchool || undefined),
    enabled: !!selectedSchool,
  });

  // Create mentor profile mutation
  const createMentorMutation = useMutation({
    mutationFn: createMentorProfile,
    onSuccess: () => {
      toast.success("Mentor profile created successfully");
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["mentorProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["mentorStatistics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create mentor profile");
    },
  });

  // Add performance metric mutation
  const addPerformanceMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PerformanceMetricRequest;
    }) => addPerformanceMetric(id, data),
    onSuccess: () => {
      toast.success("Performance metric added successfully");
      setIsPerformanceDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["mentorProfiles"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add performance metric");
    },
  });

  // Add assignment mutation
  const addAssignmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignmentRequest }) =>
      assignToMentor(id, data),
    onSuccess: () => {
      toast.success("Assignment added successfully");
      setIsAssignmentDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["mentorProfiles"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add assignment");
    },
  });

  // Add feedback mutation
  const addFeedbackMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeedbackRequest }) =>
      addFeedback(id, data),
    onSuccess: () => {
      toast.success("Feedback added successfully");
      setIsFeedbackDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["mentorProfiles"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add feedback");
    },
  });

  const handleViewProfile = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setIsProfileDialogOpen(true);
  };

  const handleAddPerformance = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setPerformanceForm({
      period: new Date().toISOString().slice(0, 7), // Current month
      studentsAssigned: mentor.professionalInfo.currentStudents,
      averageStudentImprovement: 0,
      attendanceRate: 0,
      assessmentCompletionRate: 0,
    });
    setIsPerformanceDialogOpen(true);
  };

  const handleAddAssignment = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setAssignmentForm({
      type: "student",
      targetId: "",
      targetName: "",
      priority: "medium",
    });
    setIsAssignmentDialogOpen(true);
  };

  const handleAddFeedback = (mentor: MentorProfile) => {
    setSelectedMentor(mentor);
    setFeedbackForm({
      type: "admin",
      rating: 5,
      adminId: user?.id,
    });
    setIsFeedbackDialogOpen(true);
  };

  useEffect(() => {
    if (schools.length > 0 && !selectedSchool) {
      if (user?.role === "school_admin" && user?.schoolId) {
        setSelectedSchool(user.schoolId._id);
      }
    }
  }, [schools, user, selectedSchool]);

  const mentors = mentorData?.mentors || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Comprehensive Tutor Management
        </h1>
        <p className="text-muted-foreground">
          Manage mentor profiles, performance, and assignments
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mentor Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="school">School</Label>
            <Select
              value={selectedSchool}
              onValueChange={setSelectedSchool}
              disabled={user?.role === "school_admin"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school._id} value={school._id || ""}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Select
              value={filterSpecialization}
              onValueChange={(value) =>
                setFilterSpecialization(value as Specialization | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="remedial">Remedial</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={filterStatus}
              onValueChange={(value) =>
                setFilterStatus(value as MentorStatus | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="workType">Work Type</Label>
            <Select
              value={filterWorkType}
              onValueChange={(value) =>
                setFilterWorkType(value as WorkType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant={showAvailableOnly ? "default" : "outline"}
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className="w-full"
            >
              Available Only
            </Button>
          </div>

          <div className="flex items-end">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Mentor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Mentor Profile</DialogTitle>
                  <DialogDescription>
                    Create a new comprehensive mentor profile
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      value={createForm.userId}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          userId: e.target.value,
                        }))
                      }
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      value={createForm.professionalInfo?.position || ""}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          professionalInfo: {
                            ...prev.professionalInfo!,
                            position: e.target.value,
                          },
                        }))
                      }
                      placeholder="Mentor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxStudents">Max Students</Label>
                    <Input
                      type="number"
                      value={createForm.professionalInfo?.maxStudents || 20}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          professionalInfo: {
                            ...prev.professionalInfo!,
                            maxStudents: parseInt(e.target.value) || 20,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createMentorMutation.mutate(createForm)}
                    disabled={createMentorMutation.isPending}
                  >
                    Create Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {mentorStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {mentorStats.totalMentors}
              </div>
              <div className="text-sm text-muted-foreground">Total Mentors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {mentorStats.activeMentors}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {mentorStats.totalStudentsAssigned}
              </div>
              <div className="text-sm text-muted-foreground">
                Students Assigned
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {mentorStats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mentors Table */}
      {selectedSchool && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mentor Profiles
            </CardTitle>
            <CardDescription>
              Comprehensive mentor management and performance tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMentors ? (
              <div className="text-center py-8">Loading mentors...</div>
            ) : mentors.length === 0 ? (
              <div className="text-center py-8">
                No mentors found for selected filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Specializations</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Work Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentors.map((mentor) => (
                    <TableRow key={mentor._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {mentor.userId.name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {mentor.userId.email}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {mentor.userId.phoneNo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mentor.professionalInfo.specializations.map(
                            (spec) => (
                              <Badge
                                key={spec}
                                variant="outline"
                                className="text-xs"
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                {getSpecializationLabel(spec)}
                              </Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div
                            className={`text-sm font-medium ${getWorkloadColor(
                              mentor.workloadPercentage || 0
                            )}`}
                          >
                            {mentor.professionalInfo.currentStudents}/
                            {mentor.professionalInfo.maxStudents}
                          </div>
                          <Progress
                            value={mentor.workloadPercentage || 0}
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {mentor.workloadPercentage || 0}% capacity
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium">
                            {mentor.overallRating
                              ? mentor.overallRating.toFixed(1)
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(mentor.status)}>
                          {mentor.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getWorkTypeLabel(mentor.professionalInfo.workType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewProfile(mentor)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddPerformance(mentor)}
                          >
                            <TrendingUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddAssignment(mentor)}
                          >
                            <Calendar className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddFeedback(mentor)}
                          >
                            <Star className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Mentor Profile: {selectedMentor?.userId.name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive mentor information and performance data
            </DialogDescription>
          </DialogHeader>
          {selectedMentor && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Professional Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <strong>Position:</strong>{" "}
                        {selectedMentor.professionalInfo.position}
                      </div>
                      <div>
                        <strong>Employee ID:</strong>{" "}
                        {selectedMentor.professionalInfo.employeeId || "N/A"}
                      </div>
                      <div>
                        <strong>Join Date:</strong>{" "}
                        {new Date(
                          selectedMentor.professionalInfo.joinDate
                        ).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Work Type:</strong>{" "}
                        {getWorkTypeLabel(
                          selectedMentor.professionalInfo.workType
                        )}
                      </div>
                      <div>
                        <strong>Max Students:</strong>{" "}
                        {selectedMentor.professionalInfo.maxStudents}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Qualifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedMentor.qualifications.length > 0 ? (
                        <div className="space-y-2">
                          {selectedMentor.qualifications.map((qual, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium">{qual.degree}</div>
                              <div className="text-muted-foreground">
                                {qual.institution} ({qual.year})
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No qualifications added
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Skills & Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Technical Skills:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedMentor.skills.technicalSkills.map(
                            (skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <strong>Preferred Subjects:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedMentor.preferences.preferredSubjects.map(
                            (subject, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {getSpecializationLabel(subject)}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedMentor.performanceMetrics
                    .slice(0, 4)
                    .map((metric, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            {metric.period}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>Students: {metric.studentsAssigned}</div>
                          <div>
                            Improvement: {metric.averageStudentImprovement}%
                          </div>
                          <div>Attendance: {metric.attendanceRate}%</div>
                          <div>
                            Completion: {metric.assessmentCompletionRate}%
                          </div>
                          {metric.adminRating && (
                            <div className="flex items-center gap-1">
                              Rating:{" "}
                              <Star className="w-3 h-3 text-yellow-400" />
                              {metric.adminRating}/5
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <div className="space-y-2">
                  {selectedMentor.assignments
                    .filter((a) => a.status === "active")
                    .map((assignment) => (
                      <Card key={assignment._id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {assignment.targetName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {assignment.type} •{" "}
                                {assignment.subject &&
                                  getSpecializationLabel(assignment.subject)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Started:{" "}
                                {new Date(
                                  assignment.startDate
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  assignment.priority === "high"
                                    ? "destructive"
                                    : assignment.priority === "medium"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {assignment.priority}
                              </Badge>
                              <div className="text-sm mt-1">
                                {assignment.progress || 0}% complete
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">From Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMentor.feedback.fromStudents
                          .slice(0, 3)
                          .map((feedback, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400" />
                                {feedback.rating}/5
                              </div>
                              {feedback.comment && (
                                <div className="text-muted-foreground italic">
                                  "{feedback.comment}"
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">From Parents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMentor.feedback.fromParents
                          .slice(0, 3)
                          .map((feedback, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400" />
                                {feedback.rating}/5
                              </div>
                              {feedback.comment && (
                                <div className="text-muted-foreground italic">
                                  "{feedback.comment}"
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">From Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMentor.feedback.fromAdmins
                          .slice(0, 3)
                          .map((feedback, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400" />
                                {feedback.rating}/5
                              </div>
                              {feedback.comment && (
                                <div className="text-muted-foreground italic">
                                  "{feedback.comment}"
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Performance Metric Dialog */}
      <Dialog
        open={isPerformanceDialogOpen}
        onOpenChange={setIsPerformanceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Performance Metric</DialogTitle>
            <DialogDescription>
              Record performance data for {selectedMentor?.userId.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Period</Label>
              <Input
                type="month"
                value={performanceForm.period}
                onChange={(e) =>
                  setPerformanceForm((prev) => ({
                    ...prev,
                    period: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="studentsAssigned">Students Assigned</Label>
              <Input
                type="number"
                value={performanceForm.studentsAssigned}
                onChange={(e) =>
                  setPerformanceForm((prev) => ({
                    ...prev,
                    studentsAssigned: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="improvement">Avg Improvement (%)</Label>
              <Input
                type="number"
                value={performanceForm.averageStudentImprovement}
                onChange={(e) =>
                  setPerformanceForm((prev) => ({
                    ...prev,
                    averageStudentImprovement: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="attendance">Attendance Rate (%)</Label>
              <Input
                type="number"
                value={performanceForm.attendanceRate}
                onChange={(e) =>
                  setPerformanceForm((prev) => ({
                    ...prev,
                    attendanceRate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="completion">Assessment Completion (%)</Label>
              <Input
                type="number"
                value={performanceForm.assessmentCompletionRate}
                onChange={(e) =>
                  setPerformanceForm((prev) => ({
                    ...prev,
                    assessmentCompletionRate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPerformanceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedMentor &&
                addPerformanceMutation.mutate({
                  id: selectedMentor._id,
                  data: performanceForm,
                })
              }
              disabled={addPerformanceMutation.isPending}
            >
              Add Metric
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={isAssignmentDialogOpen}
        onOpenChange={setIsAssignmentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Assignment</DialogTitle>
            <DialogDescription>
              Assign students, groups, or cohorts to{" "}
              {selectedMentor?.userId.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Assignment Type</Label>
              <Select
                value={assignmentForm.type}
                onValueChange={(value) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    type: value as "student" | "group" | "cohort",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="cohort">Cohort</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={assignmentForm.priority}
                onValueChange={(value) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    priority: value as "low" | "medium" | "high",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetId">Target ID</Label>
              <Input
                value={assignmentForm.targetId}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    targetId: e.target.value,
                  }))
                }
                placeholder="Enter target ID"
              />
            </div>
            <div>
              <Label htmlFor="targetName">Target Name</Label>
              <Input
                value={assignmentForm.targetName}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    targetName: e.target.value,
                  }))
                }
                placeholder="Enter name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAssignmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedMentor &&
                addAssignmentMutation.mutate({
                  id: selectedMentor._id,
                  data: assignmentForm,
                })
              }
              disabled={addAssignmentMutation.isPending}
            >
              Add Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={isFeedbackDialogOpen}
        onOpenChange={setIsFeedbackDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback for {selectedMentor?.userId.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Select
                value={feedbackForm.rating.toString()}
                onValueChange={(value) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    rating: parseInt(value) as 1 | 2 | 3 | 4 | 5,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Poor</SelectItem>
                  <SelectItem value="2">2 - Fair</SelectItem>
                  <SelectItem value="3">3 - Good</SelectItem>
                  <SelectItem value="4">4 - Very Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Input
                value={feedbackForm.comment || ""}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="Optional feedback comment"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFeedbackDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedMentor &&
                addFeedbackMutation.mutate({
                  id: selectedMentor._id,
                  data: feedbackForm,
                })
              }
              disabled={addFeedbackMutation.isPending}
            >
              Add Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
