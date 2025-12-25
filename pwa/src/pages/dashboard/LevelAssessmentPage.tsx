"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Search, Play } from "lucide-react";
import { BaselineAssessmentModal } from "@/components/BaselineAssessment";
import { getCohortProgress } from "@/services/progress";
import { getStudents, Student } from "@/services/students";
import { programsService, IProgram } from "@/services/programs";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function LevelAssessmentPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [programs, setPrograms] = useState<IProgram[]>([]);

  // Fetch cohort progress data
  const { data: cohortData, isLoading: loadingCohort } = useQuery({
    queryKey: ["cohort-progress", cohortId],
    queryFn: async () => {
      if (!cohortId) return null;
      return await getCohortProgress(cohortId);
    },
    enabled: !!cohortId,
  });

  // Fetch all students for the school
  const { data: allStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ["students", cohortData?.cohort.school._id],
    queryFn: async () => {
      if (!cohortData?.cohort.school._id) return [];
      return await getStudents(cohortData.cohort.school._id);
    },
    enabled: !!cohortData?.cohort.school._id,
  });

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await programsService.getPrograms({ isActive: "true" });
        setPrograms(response.programs);
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    };
    fetchPrograms();
  }, []);

  // Helper to get student's current level for the program
  const getStudentCurrentLevel = (student: Student, programId: string): number => {
    if (!student.knowledgeLevel || student.knowledgeLevel.length === 0) {
      return 0; // No assessment yet, start from level 0
    }

    // Check new structure (with program and subject)
    const programAssessments = student.knowledgeLevel.filter(
      (kl: any) => kl && kl.program && String(kl.program) === programId
    );

    if (programAssessments.length > 0) {
      // Get the most recent assessment for this program
      const latest = programAssessments.sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      return latest.level || 0;
    }

    // Fallback: if no program-specific assessment, start from level 0
    return 0;
  };

  // Get students in the cohort with their full data
  const getCohortStudentsWithData = (): Array<{
    studentData: any;
    fullStudent: Student | undefined;
    currentLevel: number;
  }> => {
    if (!cohortData?.studentsProgress || !allStudents) return [];

    return cohortData.studentsProgress.map((studentData) => {
      const fullStudent = allStudents.find(
        (s) => s._id === studentData.student._id
      );
      const programId = cohortData.cohort.program?._id;
      const currentLevel = fullStudent && programId
        ? getStudentCurrentLevel(fullStudent, programId)
        : 0;

      return {
        studentData,
        fullStudent,
        currentLevel,
      };
    });
  };

  const cohortStudents = getCohortStudentsWithData();

  // Filter students based on search
  const filteredStudents = cohortStudents.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const student = item.studentData.student;
    return (
      student.name?.toLowerCase().includes(query) ||
      student.roll_no?.toLowerCase().includes(query) ||
      student.class?.toLowerCase().includes(query)
    );
  });

  const handleStartAssessment = (item: {
    studentData: any;
    fullStudent: Student | undefined;
    currentLevel: number;
  }) => {
    if (!item.fullStudent) {
      toast.error("Student data not available");
      return;
    }

    if (!cohortData?.cohort.program) {
      toast.error("Program information not available");
      return;
    }

    setSelectedStudent(item.fullStudent);
    setIsAssessmentModalOpen(true);
  };

  const handleAssessmentComplete = async () => {
    // Refresh data after assessment
    await queryClient.invalidateQueries({ queryKey: ["cohort-progress", cohortId] });
    await queryClient.invalidateQueries({ queryKey: ["students", cohortData?.cohort.school._id] });
    setIsAssessmentModalOpen(false);
    setSelectedStudent(null);
  };

  if (loadingCohort || loadingStudents) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!cohortData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-muted-foreground mb-4">Cohort not found</p>
          <Button onClick={() => navigate("/progress/tutor")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const programId = cohortData.cohort.program?._id;
  const program = programs.find((p) => p._id === programId);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/progress/cohort/${cohortId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Level Assessment</h1>
              <p className="text-muted-foreground">
                {cohortData.cohort.name} • {cohortData.cohort.program?.subject} Program
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assessment Instructions
            </CardTitle>
            <CardDescription>
              Select students to conduct level assessments. Assessments will start from each student's next level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Students: <strong>{cohortStudents.length}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Program: <strong>{cohortData.cohort.program?.name}</strong>
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                Level {cohortData.cohort.currentLevel || 1} Completed
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll number, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Students List */}
        <div className="grid gap-4">
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery.trim()
                    ? "No students found matching your search"
                    : "No students in this cohort"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((item) => {
              const { studentData, fullStudent, currentLevel } = item;
              const student = studentData.student;
              const nextLevel = currentLevel + 1;

              return (
                <Card key={student._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{student.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              Roll: {student.roll_no}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Class {student.class}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Current Level:</span>
                              <Badge
                                variant={currentLevel > 0 ? "default" : "outline"}
                                className="text-sm"
                              >
                                {currentLevel > 0 ? `Level ${currentLevel}` : "Not Assessed"}
                              </Badge>
                            </div>
                            {currentLevel > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Next Assessment:</span>
                                <Badge variant="outline" className="text-sm">
                                  Level {nextLevel}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {fullStudent ? (
                          <Button
                            onClick={() => handleStartAssessment(item)}
                            className="flex items-center gap-2"
                          >
                            <Play className="h-4 w-4" />
                            Start Assessment
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Loading...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Assessment Modal */}
      {isAssessmentModalOpen && selectedStudent && program && (
        <BaselineAssessmentModal
          isOpen={isAssessmentModalOpen}
          onClose={() => {
            setIsAssessmentModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          programs={[program]}
          preSelectedProgramId={program._id}
          startingLevel={getStudentCurrentLevel(selectedStudent, program._id)}
          onAssessmentComplete={handleAssessmentComplete}
        />
      )}
    </div>
  );
}

