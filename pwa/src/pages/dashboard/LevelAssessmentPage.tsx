"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  Search,
  Play,
  CheckCircle,
  XCircle,
  Trophy,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import {
  getCohortProgress,
  getLevelAssessmentQuestions,
  conductLevelAssessment,
  type LevelAssessmentQuestion,
  type LevelAssessmentResult,
} from "@/services/progress";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/services";

// Test state type
type TestPhase = "list" | "testing" | "result";

interface TestState {
  studentId: string;
  studentName: string;
  questions: LevelAssessmentQuestion[];
  currentIndex: number;
  responses: Array<{ questionId: string; correct: boolean }>;
  correctCount: number;
  wrongCount: number;
  levelNumber: number;
  levelTitle: string;
}

export default function LevelAssessmentPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [testPhase, setTestPhase] = useState<TestPhase>("list");
  const [testState, setTestState] = useState<TestState | null>(null);
  const [testResult, setTestResult] = useState<LevelAssessmentResult | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testedStudents, setTestedStudents] = useState<Set<string>>(new Set());

  // Fetch cohort progress data
  const { data: cohortData, isLoading: loadingCohort } = useQuery({
    queryKey: ["cohort-progress", cohortId],
    queryFn: async () => {
      if (!cohortId) return null;
      return await getCohortProgress(cohortId);
    },
    enabled: !!cohortId,
  });

  // Filter students based on search
  const filteredStudents = (cohortData?.studentsProgress || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const student = item.student;
    return (
      student.name?.toLowerCase().includes(query) ||
      student.roll_no?.toLowerCase().includes(query) ||
      student.class?.toLowerCase().includes(query)
    );
  });

  const handleStartTest = async (studentId: string, studentName: string) => {
    if (!cohortId) return;

    setIsLoadingQuestions(true);
    try {
      const data = await getLevelAssessmentQuestions(cohortId);

      if (!data.questions || data.questions.length === 0) {
        toast.error(`No questions found for Level ${data.levelNumber}`);
        return;
      }

      setTestState({
        studentId,
        studentName,
        questions: data.questions,
        currentIndex: 0,
        responses: [],
        correctCount: 0,
        wrongCount: 0,
        levelNumber: data.levelNumber,
        levelTitle: data.levelTitle,
      });
      setTestPhase("testing");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load test questions"));
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    if (!testState || !cohortId) return;

    const question = testState.questions[testState.currentIndex];
    const newResponses = [
      ...testState.responses,
      { questionId: question._id, correct },
    ];
    const newCorrectCount = testState.correctCount + (correct ? 1 : 0);
    const newWrongCount = testState.wrongCount + (correct ? 0 : 1);
    const isLastQuestion = testState.currentIndex >= testState.questions.length - 1;

    if (isLastQuestion) {
      // Submit to backend
      setIsSubmitting(true);
      try {
        const result = await conductLevelAssessment({
          cohortId,
          studentId: testState.studentId,
          responses: newResponses,
          totalQuestions: testState.questions.length,
          correctAnswers: newCorrectCount,
        });

        setTestResult(result);
        console.log("[LevelTest] Adding to tested:", testState.studentId);
        setTestedStudents((prev) => {
          const next = new Set([...prev, testState.studentId]);
          console.log("[LevelTest] testedStudents:", Array.from(next));
          return next;
        });
        setTestState((prev) => prev ? {
          ...prev,
          responses: newResponses,
          correctCount: newCorrectCount,
          wrongCount: newWrongCount,
        } : null);
        setTestPhase("result");

        // Refresh progress data
        await queryClient.invalidateQueries({ queryKey: ["cohort-progress", cohortId] });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to submit test"));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Next question
      setTestState((prev) => prev ? {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        responses: newResponses,
        correctCount: newCorrectCount,
        wrongCount: newWrongCount,
      } : null);
    }
  };

  const handleBackToList = () => {
    setTestPhase("list");
    setTestState(null);
    setTestResult(null);
  };

  if (loadingCohort) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!cohortData) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-muted-foreground mb-4">Group not found</p>
          <Button onClick={() => navigate("/progress/tutor")}>Go Back</Button>
        </div>
      </div>
    );
  }

  // ========== RESULT SCREEN ==========
  if (testPhase === "result" && testResult && testState) {
    const scorePercent = parseFloat(testResult.score);

    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 pt-4 sm:pt-8">
          <Card className={`border-2 ${testResult.passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
            <CardContent className="p-4 sm:p-8 text-center space-y-4 sm:space-y-6">
              {/* Icon */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center ${testResult.passed ? "bg-green-100" : "bg-red-100"}`}>
                {testResult.passed ? (
                  <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
                )}
              </div>

              {/* Student Name */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{testState.studentName}</h2>
                <p className="text-sm text-muted-foreground">Level {testState.levelNumber} Test</p>
              </div>

              {/* Score */}
              <div className={`text-4xl sm:text-5xl font-bold ${testResult.passed ? "text-green-600" : "text-red-600"}`}>
                {scorePercent.toFixed(0)}%
              </div>

              {/* Pass/Fail */}
              <Badge
                className={`text-base sm:text-lg px-4 py-1.5 ${testResult.passed ? "bg-green-600 hover:bg-green-600" : "bg-red-600 hover:bg-red-600"}`}
              >
                {testResult.passed ? "PASSED" : "FAILED"}
              </Badge>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{testState.correctCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{testState.wrongCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Wrong</p>
                </div>
              </div>

              {/* Status Update */}
              <div className="bg-white rounded-lg p-3 sm:p-4">
                <p className="text-sm text-muted-foreground mb-1">Progress Status</p>
                <Badge
                  className={`text-sm px-3 py-1 ${
                    testResult.status === "green" ? "bg-green-600 hover:bg-green-600" :
                    testResult.status === "yellow" ? "bg-yellow-500 hover:bg-yellow-500" :
                    testResult.status === "orange" ? "bg-orange-500 hover:bg-orange-500" :
                    "bg-red-600 hover:bg-red-600"
                  }`}
                >
                  {testResult.status.toUpperCase()}
                </Badge>
                {testResult.passed && testResult.nextLevel && (
                  <p className="text-sm text-green-700 mt-2">
                    Moving to: <strong>{testResult.nextLevel.title}</strong>
                  </p>
                )}
                {!testResult.passed && (
                  <p className="text-sm text-red-700 mt-2">
                    Stays at Level {testState.levelNumber} • Failures: {testResult.failureCount}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <Button
                  onClick={handleBackToList}
                  size="lg"
                  className="w-full text-base"
                >
                  Test Another Student
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/progress/cohort/${cohortId}`)}
                  size="lg"
                  className="w-full text-base"
                >
                  Back to Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ========== TESTING SCREEN ==========
  if (testPhase === "testing" && testState) {
    const question = testState.questions[testState.currentIndex];
    const progressPercent = ((testState.currentIndex) / testState.questions.length) * 100;
    const total = testState.questions.length;
    const current = testState.currentIndex + 1;

    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="max-w-lg mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate">{testState.studentName}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Level {testState.levelNumber} • {testState.levelTitle}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.confirm("Cancel test? Progress will be lost.")) {
                  handleBackToList();
                }
              }}
              className="flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Q {current}/{total}</span>
              <div className="flex items-center gap-3">
                <span className="text-green-600 font-medium">✓ {testState.correctCount}</span>
                <span className="text-red-600 font-medium">✗ {testState.wrongCount}</span>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="border-2">
            <CardContent className="p-4 sm:p-8">
              <p className="text-center text-muted-foreground text-xs sm:text-sm mb-3">
                {question.questionType === "verbal_evaluation" ? "Ask student to read:" : "Question:"}
              </p>
              {question.questionImage && (
                <div className="flex justify-center mb-4">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${question.questionImage}`}
                    alt="Question"
                    className="max-h-48 sm:max-h-64 rounded-lg border object-contain"
                  />
                </div>
              )}
              <div className="text-center py-6 sm:py-10">
                <p className="text-4xl sm:text-6xl font-bold text-gray-900">
                  {question.questionText}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Answer Buttons */}
          {isSubmitting ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Submitting...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Button
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="h-16 sm:h-20 text-lg sm:text-xl border-2 border-red-300 bg-red-50 hover:bg-red-100 text-red-700"
              >
                <XCircle className="h-6 w-6 sm:h-7 sm:w-7 mr-2" />
                Wrong
              </Button>
              <Button
                onClick={() => handleAnswer(true)}
                variant="outline"
                className="h-16 sm:h-20 text-lg sm:text-xl border-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-700"
              >
                <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 mr-2" />
                Correct
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== STUDENT LIST SCREEN ==========
  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/progress/cohort/${cohortId}`)}
            className="h-10 w-10 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Level Test</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {cohortData.cohort.name} • {cohortData.cohort.program?.subject} Program
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Test Instructions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Select a student to conduct level test. 75% correct answers needed to pass.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Students: <strong>{cohortData.studentsProgress.length}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Program: <strong>{cohortData.cohort.program?.name}</strong>
                </p>
              </div>
              <Badge variant="outline" className="text-xs sm:text-sm self-start sm:self-auto">
                Testing Level {cohortData.cohort.currentLevel || 1}
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
            className="pl-9 text-sm sm:text-base"
          />
        </div>

        {/* Students List */}
        <div className="grid gap-3 sm:gap-4">
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-8 sm:py-12 text-center">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  {searchQuery.trim()
                    ? "No students found matching your search"
                    : "No students in this group"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((item) => {
              const student = item.student;
              const progress = item.progress;

              return (
                <Card key={student._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{student.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">
                              Roll: {student.roll_no}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Class {student.class}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm text-muted-foreground">Level:</span>
                            <Badge variant="default" className="text-xs sm:text-sm">
                              Level {progress.currentLevel}
                            </Badge>
                          </div>
                          <Badge
                            className={`text-xs ${
                              progress.status === "green" ? "bg-green-600 hover:bg-green-600" :
                              progress.status === "yellow" ? "bg-yellow-500 hover:bg-yellow-500" :
                              progress.status === "orange" ? "bg-orange-500 hover:bg-orange-500" :
                              progress.status === "red" ? "bg-red-600 hover:bg-red-600" :
                              "bg-gray-500"
                            }`}
                          >
                            {progress.status.toUpperCase()}
                          </Badge>
                          {progress.failureCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {progress.failureCount} failure{progress.failureCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        {/* Button on mobile */}
                        <div className="mt-2 sm:hidden">
                          {testedStudents.has(student._id) ? (
                            <Badge className="bg-green-600 text-white w-full justify-center py-1.5">
                              ✓ Test Completed
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => handleStartTest(student._id, student.name)}
                              size="sm"
                              disabled={isLoadingQuestions}
                              className="w-full flex items-center justify-center gap-2"
                            >
                              {isLoadingQuestions ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              Start Test
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Button on desktop */}
                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        {testedStudents.has(student._id) ? (
                          <Badge className="bg-green-600 text-white py-1.5 px-3">
                            ✓ Test Completed
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleStartTest(student._id, student.name)}
                            disabled={isLoadingQuestions}
                            className="flex items-center gap-2"
                          >
                            {isLoadingQuestions ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            Start Test
                          </Button>
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
    </div>
  );
}
