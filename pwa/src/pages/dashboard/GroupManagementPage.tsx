"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Users,
  BookOpen,
  UserCheck,
  Settings,
  ArrowUpDown,
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
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSchools } from "@/services/schools";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  autoAssignStudentsToGroups,
  getGroupStatistics,
  type Group,
  type GroupLevel,
  type Subject,
  type CreateGroupRequest,
  type UpdateGroupRequest,
} from "@/services/groups";

export default function GroupManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<Subject | "all">("all");
  const [filterLevel, setFilterLevel] = useState<GroupLevel | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: "",
    level: "A",
    subject: "hindi",
    schoolId: "",
    mentorId: "",
    description: "",
    minLevel: 1,
    maxLevel: 2,
    capacity: 30,
    autoAssignment: true,
  });

  // Fetch schools
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Fetch groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["groups", selectedSchool, filterSubject, filterLevel],
    queryFn: () =>
      getGroups({
        schoolId: selectedSchool || undefined,
        subject: filterSubject === "all" ? undefined : filterSubject,
        level: filterLevel === "all" ? undefined : filterLevel,
      }),
    enabled: !!selectedSchool,
  });

  // Fetch group statistics
  const { data: groupStatsData = [] } = useQuery({
    queryKey: ["groupStatistics", selectedSchool, filterSubject],
    queryFn: () =>
      getGroupStatistics(
        selectedSchool || undefined,
        filterSubject === "all" ? undefined : filterSubject
      ),
    enabled: !!selectedSchool,
  });

  // Ensure groupStats is always an array
  const groupStats = Array.isArray(groupStatsData) ? groupStatsData : [];

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      toast.success("Group created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groupStatistics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupRequest }) =>
      updateGroup(id, data),
    onSuccess: () => {
      toast.success("Group updated successfully");
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update group");
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      toast.success("Group deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groupStatistics"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  // Auto-assign mutation
  const autoAssignMutation = useMutation({
    mutationFn: autoAssignStudentsToGroups,
    onSuccess: (data) => {
      toast.success(
        `Assignment completed: ${data.results.assigned} students assigned`
      );
      if (data.results.errors > 0) {
        toast.warning(
          `${data.results.errors} errors occurred during assignment`
        );
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to auto-assign students");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      level: "A",
      subject: "hindi",
      schoolId: selectedSchool,
      mentorId: "",
      description: "",
      minLevel: 1,
      maxLevel: 2,
      capacity: 30,
      autoAssignment: true,
    });
  };

  const handleCreateGroup = () => {
    if (!formData.name || !formData.schoolId) {
      toast.error("Please fill in all required fields");
      return;
    }
    createGroupMutation.mutate(formData);
  };

  const handleUpdateGroup = () => {
    if (!selectedGroup) return;

    const updateData: UpdateGroupRequest = {
      name: formData.name,
      level: formData.level,
      subject: formData.subject,
      mentorId: formData.mentorId || undefined,
      description: formData.description,
      minLevel: formData.minLevel,
      maxLevel: formData.maxLevel,
      capacity: formData.capacity,
      autoAssignment: formData.autoAssignment,
    };

    updateGroupMutation.mutate({ id: selectedGroup._id, data: updateData });
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      level: group.level,
      subject: group.subject,
      schoolId: group.school._id,
      mentorId: group.mentor?._id || "",
      description: group.description || "",
      minLevel: group.minLevel,
      maxLevel: group.maxLevel,
      capacity: group.capacity,
      autoAssignment: group.autoAssignment,
    });
    setIsEditDialogOpen(true);
  };

  const handleAutoAssign = (subject: Subject) => {
    if (!selectedSchool) {
      toast.error("Please select a school first");
      return;
    }
    autoAssignMutation.mutate({ schoolId: selectedSchool, subject });
  };

  const getLevelBadgeColor = (level: GroupLevel) => {
    const colors = {
      A: "bg-green-100 text-green-800",
      B: "bg-blue-100 text-blue-800",
      C: "bg-yellow-100 text-yellow-800",
      D: "bg-orange-100 text-orange-800",
      E: "bg-red-100 text-red-800",
    };
    return colors[level];
  };

  useEffect(() => {
    if (schools.length > 0 && !selectedSchool) {
      // Auto-select school if user is school admin
      if (user?.role === "school_admin" && user?.schoolId) {
        setSelectedSchool(user.schoolId._id);
      }
    }
  }, [schools, user, selectedSchool]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, schoolId: selectedSchool }));
  }, [selectedSchool]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Level-Based Group Management
        </h1>
        <p className="text-muted-foreground">
          Organize students into performance-based learning groups
        </p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Group Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={filterSubject}
              onValueChange={(value) =>
                setFilterSubject(value as Subject | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="math">Math</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="level">Level</Label>
            <Select
              value={filterLevel}
              onValueChange={(value) =>
                setFilterLevel(value as GroupLevel | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A">Level A</SelectItem>
                <SelectItem value="B">Level B</SelectItem>
                <SelectItem value="C">Level C</SelectItem>
                <SelectItem value="D">Level D</SelectItem>
                <SelectItem value="E">Level E</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Create a new learning group with performance level criteria
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Advanced Hindi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Performance Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          level: value as GroupLevel,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Level A (Excellent)</SelectItem>
                        <SelectItem value="B">Level B (Good)</SelectItem>
                        <SelectItem value="C">Level C (Average)</SelectItem>
                        <SelectItem value="D">
                          Level D (Below Average)
                        </SelectItem>
                        <SelectItem value="E">
                          Level E (Needs Support)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          subject: value as Subject,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hindi">Hindi</SelectItem>
                        <SelectItem value="math">Math</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Max Capacity</Label>
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          capacity: parseInt(e.target.value) || 30,
                        }))
                      }
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minLevel">Min Assessment Level</Label>
                    <Input
                      type="number"
                      value={formData.minLevel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          minLevel: parseInt(e.target.value) || 1,
                        }))
                      }
                      min="1"
                      max="5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLevel">Max Assessment Level</Label>
                    <Input
                      type="number"
                      value={formData.maxLevel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxLevel: parseInt(e.target.value) || 5,
                        }))
                      }
                      min="1"
                      max="5"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Group description..."
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
                    onClick={handleCreateGroup}
                    disabled={createGroupMutation.isPending}
                  >
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() =>
                filterSubject &&
                filterSubject !== "all" &&
                handleAutoAssign(filterSubject)
              }
              disabled={
                !selectedSchool ||
                !filterSubject ||
                filterSubject === "all" ||
                autoAssignMutation.isPending
              }
              className="w-full"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Auto-Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedSchool && (
        <div>
          {groupStats && groupStats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {groupStats.map((stat) => (
                <Card key={`${stat._id.level}-${stat._id.subject}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getLevelBadgeColor(stat._id.level)}>
                        Level {stat._id.level}
                      </Badge>
                      <Badge variant="outline">{stat._id.subject}</Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {stat.totalStudents}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.totalGroups} groups •{" "}
                      {Math.round(stat.avgStudentsPerGroup)} avg
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground">
                  No group statistics available for this school
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Groups Table */}
      {selectedSchool && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Learning Groups
            </CardTitle>
            <CardDescription>
              Performance-based student groups for targeted learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingGroups ? (
              <div className="text-center py-8">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8">
                No groups found for selected filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Level Range</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group._id}>
                      <TableCell className="font-medium">
                        {group.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelBadgeColor(group.level)}>
                          Level {group.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {group.subject}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <UserCheck className="w-3 h-3 mr-1" />
                          {group.students.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {group.mentor ? group.mentor.name : "Not assigned"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {group.minLevel} - {group.maxLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            group.students.length >= group.capacity
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {group.students.length}/{group.capacity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditGroup(group)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              deleteGroupMutation.mutate(group._id)
                            }
                            disabled={deleteGroupMutation.isPending}
                          >
                            Delete
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group settings and criteria
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Advanced Hindi"
              />
            </div>
            <div>
              <Label htmlFor="level">Performance Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    level: value as GroupLevel,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Level A (Excellent)</SelectItem>
                  <SelectItem value="B">Level B (Good)</SelectItem>
                  <SelectItem value="C">Level C (Average)</SelectItem>
                  <SelectItem value="D">Level D (Below Average)</SelectItem>
                  <SelectItem value="E">Level E (Needs Support)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subject: value as Subject,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    capacity: parseInt(e.target.value) || 30,
                  }))
                }
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="minLevel">Min Assessment Level</Label>
              <Input
                type="number"
                value={formData.minLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minLevel: parseInt(e.target.value) || 1,
                  }))
                }
                min="1"
                max="5"
              />
            </div>
            <div>
              <Label htmlFor="maxLevel">Max Assessment Level</Label>
              <Input
                type="number"
                value={formData.maxLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxLevel: parseInt(e.target.value) || 5,
                  }))
                }
                min="1"
                max="5"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Group description..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGroup}
              disabled={updateGroupMutation.isPending}
            >
              Update Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
