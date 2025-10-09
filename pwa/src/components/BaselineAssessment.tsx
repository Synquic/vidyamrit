"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calculator,
  Trophy,
  Target,
  ArrowRight,
  CheckCircle,
  XCircle,
  X,
  Brain,
  Loader2,
  CheckIcon,
} from "lucide-react";
import { mathData } from "@/data/math-data";
import { hindiData } from "@/data/hindi-data";
import { createAssessment } from "@/services/assessments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Student } from "@/services/students";

type Subject = "hindi" | "math";
type TestState = "intro" | "testing" | "completed";

interface TestResult {
  subject: Subject;
  level: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface BaselineAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onAssessmentComplete?: () => void;
  // New configurable parameters
  oscillationTolerance?: number; // How many oscillation cycles before stopping (default: 2)
  minQuestionsBeforeOscillationStop?: number; // Minimum questions before oscillation stop (default: 8)
  maxQuestionsPerLevel?: number; // Maximum questions at same level before moving on (default: 4)
}

export function BaselineAssessmentModal({
  isOpen,
  onClose,
  student,
  onAssessmentComplete,
  oscillationTolerance = 2, // Configurable: lower = quicker stop, higher = longer test
  minQuestionsBeforeOscillationStop = 8, // Minimum questions before oscillation can end test
  maxQuestionsPerLevel = 4, // Maximum questions at same level before considering stable
}: BaselineAssessmentModalProps) {
  const { user } = useAuth();
  const [testState, setTestState] = useState<TestState>("intro");
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [levelStabilityCount, setLevelStabilityCount] = useState(0);
  const [highPerformanceStreak, setHighPerformanceStreak] = useState(0);
  const [levelHistory, setLevelHistory] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuickComplete, setShowQuickComplete] = useState(false); // add randomized complete button state for minimal logic change

  // New state for better oscillation tracking
  const [questionsAtCurrentLevel, setQuestionsAtCurrentLevel] = useState(0);
  const [oscillationPattern, setOscillationPattern] = useState<{
    levels: [number, number];
    cycles: number;
    questionsInPattern: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.href);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

  useEffect(() => {
    if (testState === "testing" && !showFeedback) {
      setShowQuickComplete(totalQuestions >= 5 && Math.random() < 0.25);
    } else {
      setShowQuickComplete(false);
    }
  }, [testState, showFeedback, totalQuestions, currentQuestionIndex]);

  const startTest = (subject: Subject) => {
    setCurrentSubject(subject);
    setTestState("testing");
    setCurrentLevel(0);
    setCorrectStreak(0);
    setWrongStreak(0);
    setCurrentQuestionIndex(0);
    setTotalQuestions(0);
    setCorrectAnswers(0);
    setSelectedAnswer("");
    setShowFeedback(false);
    setLevelStabilityCount(0);
    setHighPerformanceStreak(0);
    setLevelHistory([0]);
    setQuestionsAtCurrentLevel(0);
    setOscillationPattern(null);
    setShowQuickComplete(false); // Reset quick complete state on start
  };

  const getCurrentQuestion = () => {
    if (!currentSubject) return null;

    const data = currentSubject === "math" ? mathData : hindiData;
    const levelData = data[currentLevel];

    if (currentSubject === "math") {
      return levelData.questions[
        currentQuestionIndex % levelData.questions.length
      ];
    } else {
      return {
        question:
          levelData.questions[
            currentQuestionIndex % levelData.questions.length
          ],
        isReadingTest: true,
      };
    }
  };

  const detectOscillation = (_newLevel: number, history: number[]) => {
    if (history.length < 4) return null;

    // Look for alternating pattern in recent history
    const recent = history.slice(-6);

    // Simple oscillation: A -> B -> A -> B
    if (recent.length >= 4) {
      const last4 = recent.slice(-4);
      const isSimpleOscillation =
        last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1];

      if (isSimpleOscillation) {
        const levels: [number, number] = [
          Math.min(last4[0], last4[1]),
          Math.max(last4[0], last4[1]),
        ];
        return { levels, type: "simple" };
      }
    }

    // Extended oscillation: A -> B -> A -> B -> A -> B
    if (recent.length >= 6) {
      const isExtendedOscillation =
        recent[0] === recent[2] &&
        recent[2] === recent[4] &&
        recent[1] === recent[3] &&
        recent[3] === recent[5] &&
        recent[0] !== recent[1];

      if (isExtendedOscillation) {
        const levels: [number, number] = [
          Math.min(recent[0], recent[1]),
          Math.max(recent[0], recent[1]),
        ];
        return { levels, type: "extended" };
      }
    }

    return null;
  };

  const handleAnswer = (answer: string | boolean) => {
    const question = getCurrentQuestion();
    if (!question || !currentSubject) return;

    let correct = false;

    if (currentSubject === "math") {
      correct = answer === (question as any).correct_answer;
    } else {
      correct = answer === true;
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setCorrectStreak((prev) => prev + 1);
      setWrongStreak(0);
      setCorrectAnswers((prev) => prev + 1);
      if (currentLevel >= 5) {
        setHighPerformanceStreak((prev) => prev + 1);
      }
    } else {
      setWrongStreak((prev) => prev + 1);
      setCorrectStreak(0);
      setHighPerformanceStreak(0);
    }

    setTotalQuestions((prev) => prev + 1);
    setQuestionsAtCurrentLevel((prev) => prev + 1);

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    const previousLevel = currentLevel;
    let newLevel = currentLevel;
    let levelChanged = false;

    // Level progression logic
    if (highPerformanceStreak >= 3 && currentLevel >= 6 && currentLevel < 9) {
      newLevel = currentLevel + 2;
      setCurrentLevel(newLevel);
      setCorrectStreak(0);
      setHighPerformanceStreak(0);
      setLevelStabilityCount(0);
      levelChanged = true;
    } else if (correctStreak >= 2 && currentLevel < 9) {
      newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      setCorrectStreak(0);
      setLevelStabilityCount(0);
      levelChanged = true;
    } else if (wrongStreak >= 2 && currentLevel > 0) {
      newLevel = currentLevel - 1;
      setCurrentLevel(newLevel);
      setWrongStreak(0);
      setLevelStabilityCount(0);
      levelChanged = true;
    } else if (previousLevel === currentLevel) {
      setLevelStabilityCount((prev) => prev + 1);
    }

    // Reset questions at current level if level changed
    if (levelChanged) {
      setQuestionsAtCurrentLevel(0);
    }

    const newHistory = [...levelHistory, newLevel];
    setLevelHistory(newHistory);

    // IMMEDIATE oscillation check - stop if we're bouncing between 2 levels
    const last3Levels = newHistory.slice(-3);
    const isImmediateOscillation =
      last3Levels.length === 3 &&
      last3Levels[0] === last3Levels[2] &&
      last3Levels[0] !== last3Levels[1] &&
      totalQuestions >= 3;

    if (isImmediateOscillation) {
      // Stop immediately and assign the lower level
      const lowerLevel = Math.min(last3Levels[0], last3Levels[1]);
      console.log(
        `🛑 IMMEDIATE OSCILLATION DETECTED: ${last3Levels[0]}→${last3Levels[1]}→${last3Levels[2]} after ${totalQuestions} questions. Assigning level ${lowerLevel}.`
      );
      setCurrentLevel(lowerLevel);
      completeTest();
      return;
    }

    // Enhanced oscillation detection
    const oscillationResult = detectOscillation(newLevel, newHistory);
    if (oscillationResult) {
      const { levels, type } = oscillationResult;

      if (
        oscillationPattern &&
        oscillationPattern.levels[0] === levels[0] &&
        oscillationPattern.levels[1] === levels[1]
      ) {
        // Same oscillation pattern continues
        setOscillationPattern((prev) =>
          prev
            ? {
                ...prev,
                cycles: prev.cycles + (type === "simple" ? 0.5 : 1),
                questionsInPattern: prev.questionsInPattern + 1,
              }
            : null
        );
      } else {
        // New oscillation pattern detected
        setOscillationPattern({
          levels,
          cycles: type === "simple" ? 0.5 : 1,
          questionsInPattern: 1,
        });
      }
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer("");
    setShowFeedback(false);

    // Enhanced stopping conditions
    const hasMinQuestions = totalQuestions >= minQuestionsBeforeOscillationStop;
    const hasOscillationPattern =
      oscillationPattern && oscillationPattern.cycles >= oscillationTolerance;
    const isStableAtLevel =
      levelStabilityCount >= maxQuestionsPerLevel && totalQuestions >= 12;
    const hasMaxPerformance =
      currentLevel === 9 && correctStreak >= 2 && totalQuestions >= 15;
    const hasMinPerformance =
      wrongStreak >= 4 && currentLevel === 0 && totalQuestions >= 10;
    const hasMaxQuestions = totalQuestions >= 35;
    const tooManyQuestionsAtLevel =
      questionsAtCurrentLevel >= maxQuestionsPerLevel * 2;

    // AGGRESSIVE: Stop on simple level bounce pattern
    const recentHistory = newHistory.slice(-4);
    const hasSimpleBounce =
      recentHistory.length >= 4 &&
      recentHistory[0] === recentHistory[2] &&
      recentHistory[1] === recentHistory[3] &&
      recentHistory[0] !== recentHistory[1] &&
      totalQuestions >= Math.max(4, minQuestionsBeforeOscillationStop - 2);

    const shouldStop =
      hasMaxQuestions ||
      hasMaxPerformance ||
      hasMinPerformance ||
      isStableAtLevel ||
      (hasMinQuestions && hasOscillationPattern) ||
      (hasMinQuestions && tooManyQuestionsAtLevel) ||
      hasSimpleBounce; // New aggressive stopping condition

    if (shouldStop) {
      // If stopping due to oscillation, set level to the lower of the oscillating levels
      if ((hasOscillationPattern && oscillationPattern) || hasSimpleBounce) {
        if (hasSimpleBounce) {
          const lowerLevel = Math.min(recentHistory[0], recentHistory[1]);
          console.log(
            `🛑 SIMPLE BOUNCE DETECTED: Pattern ${recentHistory.join(
              "→"
            )} after ${totalQuestions} questions. Assigning level ${lowerLevel}.`
          );
          setCurrentLevel(lowerLevel);
        } else if (oscillationPattern) {
          console.log(
            `🛑 OSCILLATION PATTERN DETECTED: ${oscillationPattern.cycles} cycles after ${totalQuestions} questions. Assigning level ${oscillationPattern.levels[0]}.`
          );
          setCurrentLevel(oscillationPattern.levels[0]);
        }
      }
      completeTest();
    }
  };

  const completeTest = async () => {
    if (!currentSubject) return;

    const result: TestResult = {
      subject: currentSubject,
      level: currentLevel + 1,
      totalQuestions,
      correctAnswers,
    };

    setResults((prev) => [...prev, result]);

    // If we have a student, save the assessment result
    if (student && user) {
      try {
        setIsSaving(true);

        console.log("Saving assessment with user data:", {
          student: student._id,
          school: student.schoolId._id,
          mentor: user.id,
          subject: currentSubject,
          level: result.level,
          userObject: user,
        });

        // Save assessment to backend
        await createAssessment({
          student: student._id,
          school: student.schoolId._id,
          mentor: user.id,
          subject: currentSubject,
          level: result.level,
        });

        toast.success(
          `${currentSubject} assessment saved! Level: ${result.level}`
        );
      } catch (error) {
        console.error("Error saving assessment:", error);
        toast.error("Failed to save assessment. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }

    setTestState("completed");
  };

  const resetTest = () => {
    setTestState("intro");
    setCurrentSubject(null);
    setResults([]);
    setQuestionsAtCurrentLevel(0);
    setOscillationPattern(null);
    setShowQuickComplete(false); // Reset quick complete state on reset
  };

  const handleClose = () => {
    // If assessment was completed and we have results, call the completion callback
    if (
      testState === "completed" &&
      results.length > 0 &&
      onAssessmentComplete
    ) {
      onAssessmentComplete();
    }
    resetTest();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Baseline Assessment</h2>
                  {student ? (
                    <p className="text-sm text-muted-foreground">
                      Assessing: {student.name} (Roll: {student.roll_no})
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Adaptive Learning Test
                    </p>
                  )}
                </div>
              </div>
              {testState !== "testing" && (
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="p-6">
              {testState === "intro" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div
                      className="flex justify-center mb-4"
                      aria-hidden="true"
                    >
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-balance">
                      Baseline Assessment
                    </h1>
                    <p className="text-sm text-muted-foreground text-pretty">
                      Choose a subject to begin
                    </p>
                  </div>

                  <div className="space-y-4" aria-label="Choose a subject">
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => startTest("hindi")}
                      aria-label="Start Hindi assessment"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="bg-blue-100 p-2 rounded-lg"
                              aria-hidden="true"
                            >
                              <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Hindi Language</h3>
                              <p className="text-sm text-muted-foreground">
                                Reading & comprehension
                              </p>
                            </div>
                          </div>
                          <ArrowRight
                            className="h-5 w-5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => startTest("math")}
                      aria-label="Start Math assessment"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="bg-green-100 p-2 rounded-lg"
                              aria-hidden="true"
                            >
                              <Calculator className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Mathematics</h3>
                              <p className="text-sm text-muted-foreground">
                                Problem solving
                              </p>
                            </div>
                          </div>
                          <ArrowRight
                            className="h-5 w-5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {testState === "testing" && (
                <div className="space-y-6">
                  {/* Streamlined Header */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      aria-label={`Level ${currentLevel + 1}`}
                    >
                      Level {currentLevel + 1}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      aria-label={`Question ${totalQuestions + 1}`}
                    >
                      Q{totalQuestions + 1}
                    </Badge>
                  </div>

                  <Card>
                    <CardHeader>
                      {/* Keep Title; Remove Instructions */}
                      <CardTitle className="text-base text-balance">
                        {currentSubject === "math"
                          ? mathData[currentLevel].title
                          : hindiData[currentLevel].title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {currentSubject === "math" ? (
                        <>
                          {/* Bigger Question Font */}
                          <div className="text-3xl font-bold text-center py-6 bg-muted/50 rounded-lg">
                            {(getCurrentQuestion() as any)?.question}
                          </div>

                          {!showFeedback ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {(getCurrentQuestion() as any)?.options.map(
                                (option: string, index: number) => (
                                  <Button
                                    key={index}
                                    variant={
                                      selectedAnswer === option
                                        ? "default"
                                        : "outline"
                                    }
                                    className="h-16 text-2xl"
                                    onClick={() => {
                                      setSelectedAnswer(option);
                                      handleAnswer(option);
                                    }}
                                    disabled={showFeedback}
                                    aria-label={`Select option ${option}`}
                                  >
                                    {option}
                                  </Button>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <div
                                className={`flex items-center justify-center gap-3 text-2xl font-semibold ${
                                  isCorrect ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle
                                      className="h-7 w-7"
                                      aria-hidden="true"
                                    />
                                    Correct
                                  </>
                                ) : (
                                  <>
                                    <XCircle
                                      className="h-7 w-7"
                                      aria-hidden="true"
                                    />
                                    Incorrect
                                  </>
                                )}
                              </div>
                              {!isCorrect && (
                                <p className="text-sm text-muted-foreground">
                                  Correct answer:{" "}
                                  {
                                    (getCurrentQuestion() as any)
                                      ?.correct_answer
                                  }
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Much Bigger Character Text */}
                          <div className="text-7xl font-extrabold text-center py-8 bg-muted/50 rounded-lg">
                            {(getCurrentQuestion() as any)?.question}
                          </div>

                          {!showFeedback ? (
                            <div className="grid grid-cols-2 gap-4">
                              {/* Big Red Reject Button */}
                              <Button
                                variant="destructive"
                                className="h-20"
                                onClick={() => handleAnswer(false)}
                                aria-label="Rejection, cannot read"
                              >
                                <X
                                  className="h-24 w-24 stroke-[4]"
                                  aria-hidden="true"
                                />
                              </Button>
                              {/* Big Green Correct Button */}
                              <Button
                                className="h-20 bg-green-600 text-white hover:bg-green-700"
                                onClick={() => handleAnswer(true)}
                                aria-label="Correct, can read"
                              >
                                <CheckIcon
                                  className="h-24 w-24 stroke-[4]"
                                  aria-hidden="true"
                                />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <div
                                className={`flex items-center justify-center gap-3 text-2xl font-semibold ${
                                  isCorrect ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle
                                      className="h-7 w-7"
                                      aria-hidden="true"
                                    />
                                    Great job!
                                  </>
                                ) : (
                                  <>
                                    <XCircle
                                      className="h-7 w-7"
                                      aria-hidden="true"
                                    />
                                    Keep practicing!
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Randomly-Appearing Complete Test Button */}
                  {showQuickComplete && !showFeedback && (
                    <Button
                      variant="outline"
                      className="w-full h-8 text-lg bg-transparent border-primary text-primary hover:bg-primary/10"
                      onClick={completeTest}
                      aria-label="Complete test now"
                    >
                      End Test
                    </Button>
                  )}
                </div>
              )}

              {testState === "completed" && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-balance">
                      Assessment Complete!
                    </h1>
                    <p className="text-muted-foreground text-pretty">
                      Here are your baseline results
                    </p>
                  </div>

                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  result.subject === "hindi"
                                    ? "bg-blue-100"
                                    : "bg-green-100"
                                }`}
                              >
                                {result.subject === "hindi" ? (
                                  <BookOpen
                                    className={`h-5 w-5 ${
                                      result.subject === "hindi"
                                        ? "text-blue-600"
                                        : "text-green-600"
                                    }`}
                                  />
                                ) : (
                                  <Calculator className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold capitalize">
                                  {result.subject}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {result.correctAnswers}/
                                  {result.totalQuestions} correct
                                </p>
                              </div>
                            </div>
                            <Badge className="text-lg px-3 py-1">
                              Level {result.level}
                            </Badge>
                          </div>
                          <Progress
                            value={(result.level / 10) * 100}
                            className="h-2"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full h-12 bg-transparent"
                      onClick={handleClose}
                      disabled={isSaving}
                    >
                      {isSaving && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {isSaving ? "Saving..." : "Finish Assessment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
