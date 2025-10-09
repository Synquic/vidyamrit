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
  CheckCircle,
  XCircle,
  X,
  Brain,
  Loader2,
  CheckIcon,
} from "lucide-react";
import { createAssessment } from "@/services/assessments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Student } from "@/services/students";
import type { IProgram } from "@/services/programs";

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
  program?: IProgram | null;
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
  program,
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

  // State for randomized questions
  const [shuffledQuestions, setShuffledQuestions] = useState<{
    [levelIndex: number]: any[];
  }>({});

  // Function to shuffle an array using Fisher-Yates algorithm
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to get or create shuffled questions for a level
  const getShuffledQuestionsForLevel = (levelIndex: number) => {
    if (!program || !program.levels || levelIndex >= program.levels.length) {
      return [];
    }

    // If we already have shuffled questions for this level, return them
    if (shuffledQuestions[levelIndex]) {
      return shuffledQuestions[levelIndex];
    }

    // Otherwise, create and store shuffled questions for this level
    const levelData = program.levels[levelIndex];
    if (
      !levelData.assessmentQuestions ||
      levelData.assessmentQuestions.length === 0
    ) {
      return [];
    }

    const shuffled = shuffleArray(levelData.assessmentQuestions);
    setShuffledQuestions((prev) => ({
      ...prev,
      [levelIndex]: shuffled,
    }));

    return shuffled;
  };

  // Function to render text with line breaks and dynamic font sizing
  const renderQuestionWithLineBreaks = (text: string) => {
    if (!text) return text;

    return text.split("/n").map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  // Function to get dynamic font classes based on text length
  const getDynamicFontClasses = (text: string) => {
    if (!text) return "text-4xl font-bold";

    const cleanText = text.replace(/\/n/g, " ").trim(); // Remove /n and trim spaces
    const textLength = cleanText.length;

    if (textLength <= 10) {
      // Short text (1-2 words) - very large font
      return "text-6xl font-bold";
    } else if (textLength <= 30) {
      // Medium text - large font
      return "text-4xl font-bold";
    } else if (textLength <= 60) {
      // Longer text - medium font
      return "text-2xl font-semibold";
    } else {
      // Very long text - smaller font
      return "text-xl font-medium";
    }
  };

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
      // Show complete button after 5 questions OR after any wrong answer
      setShowQuickComplete(
        totalQuestions >= 5 || wrongStreak >= 1 || Math.random() < 0.25
      );
    } else {
      setShowQuickComplete(false);
    }
  }, [
    testState,
    showFeedback,
    totalQuestions,
    currentQuestionIndex,
    wrongStreak,
  ]);

  const startTest = async () => {
    if (!program || !student) {
      toast.error("Program and student are required");
      return;
    }

    console.log("=== STARTING LOCAL ASSESSMENT ===");
    console.log("Program:", program.name);
    console.log("Student:", student.name);
    console.log("Using local assessment mode");
    console.log("===================================");

    try {
      // Start local assessment - no backend call needed during testing
      setCurrentSubject(program.subject as Subject);
      setTestState("testing");
      setCurrentLevel(0);
      setCorrectStreak(0);
      setWrongStreak(0);
      setCurrentQuestionIndex(0);
      setTotalQuestions(0);
      setCorrectAnswers(0);
      setShowFeedback(false);
      setLevelStabilityCount(0);
      setHighPerformanceStreak(0);
      setLevelHistory([0]);
      setQuestionsAtCurrentLevel(0);
      setOscillationPattern(null);
      setShowQuickComplete(false);
      setShuffledQuestions({}); // Reset shuffled questions for new test

      toast.success("Assessment started!");
    } catch (error) {
      console.error("Failed to start assessment:", error);
      toast.error("Failed to start assessment");
    }
  };

  const getCurrentQuestion = () => {
    if (!program || !program.levels || currentLevel >= program.levels.length) {
      console.error(
        `❌ Level ${currentLevel} exceeds available levels (max: ${
          program?.levels ? program.levels.length - 1 : "unknown"
        })`
      );
      return null;
    }

    // Get shuffled questions for the current level
    const shuffledLevelQuestions = getShuffledQuestionsForLevel(currentLevel);

    if (shuffledLevelQuestions.length === 0) {
      console.error(`❌ No questions available for level ${currentLevel}`);
      return null;
    }

    // Use shuffled questions instead of sequential ones
    const questionIndex = currentQuestionIndex % shuffledLevelQuestions.length;
    const question = shuffledLevelQuestions[questionIndex];

    // For program-based questions, we always treat them as reading tests
    return {
      question: question.questionText,
      questionType: question.questionType,
      isReadingTest: true,
      // Add additional data for different question types if needed
      options: question.options,
      correctOptionIndex: question.correctOptionIndex,
      acceptedAnswers: question.acceptedAnswers,
    };
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

  const handleAnswer = async (answer: string | boolean) => {
    console.log("=== HANDLE ANSWER CALLED ===");
    console.log("Answer:", answer);
    console.log("Current state:", { testState, showFeedback, currentSubject });
    console.log("============================");

    const question = getCurrentQuestion();
    if (!question || !currentSubject) {
      console.log("Missing required data:", {
        question: !!question,
        currentSubject,
      });
      return;
    }

    let correct = false;

    // For program-based assessments, we're treating them as reading tests
    // so we expect boolean answers (true = can read, false = cannot read)
    if (typeof answer === "boolean") {
      correct = answer === true; // The student can read it
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

    try {
      // For local assessment, we don't call the backend API during testing
      // We just process the answer locally and will save the result at the end
      console.log(
        "Answer submitted locally:",
        answer,
        "for question:",
        question
      );
    } catch (error) {
      console.error("Failed to process answer:", error);
      toast.error("Failed to process answer");
    }

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    const previousLevel = currentLevel;
    let newLevel = currentLevel;
    let levelChanged = false;

    // Get max level available in the program
    const maxLevel = program?.levels ? program.levels.length - 1 : 9;

    // Level progression logic with bounds checking
    if (
      highPerformanceStreak >= 3 &&
      currentLevel >= 6 &&
      currentLevel < maxLevel
    ) {
      newLevel = Math.min(currentLevel + 2, maxLevel); // Don't exceed max level
      setCurrentLevel(newLevel);
      setCorrectStreak(0);
      setHighPerformanceStreak(0);
      setLevelStabilityCount(0);
      levelChanged = true;
    } else if (correctStreak >= 2 && currentLevel < maxLevel) {
      newLevel = Math.min(currentLevel + 1, maxLevel); // Don't exceed max level
      setCurrentLevel(newLevel);
      setCorrectStreak(0);
      setLevelStabilityCount(0);
      levelChanged = true;
    } else if (wrongStreak >= 2 && currentLevel > 0) {
      newLevel = Math.max(currentLevel - 1, 0); // Don't go below 0
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

    // Safety check: if we've reached or exceeded max level, complete the test
    if (newLevel >= maxLevel && totalQuestions >= 8) {
      console.log(
        `🛑 REACHED MAX LEVEL: Level ${newLevel} (max: ${maxLevel}) after ${totalQuestions} questions.`
      );
      setCurrentLevel(maxLevel);
      completeTest();
      return;
    }

    const newHistory = [...levelHistory, newLevel];
    setLevelHistory(newHistory);

    // IMMEDIATE oscillation check - stop if we're bouncing between 2 levels
    // Made less aggressive: require more questions and more bounces
    const last3Levels = newHistory.slice(-3);
    const isImmediateOscillation =
      last3Levels.length === 3 &&
      last3Levels[0] === last3Levels[2] &&
      last3Levels[0] !== last3Levels[1] &&
      totalQuestions >= 8 && // Increased from 3 to 8 questions minimum
      levelStabilityCount <= 1; // Only trigger if we haven't been stable

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
    setShowFeedback(false);

    // Enhanced stopping conditions - made less aggressive
    const hasMinQuestions = totalQuestions >= minQuestionsBeforeOscillationStop;
    const hasOscillationPattern =
      oscillationPattern && oscillationPattern.cycles >= oscillationTolerance;
    const isStableAtLevel =
      levelStabilityCount >= maxQuestionsPerLevel * 1.5 && totalQuestions >= 15; // Increased requirements
    const hasMaxPerformance =
      currentLevel === maxLevel && correctStreak >= 3 && totalQuestions >= 20; // Use actual max level
    const hasMinPerformance =
      wrongStreak >= 5 && currentLevel === 0 && totalQuestions >= 12; // Made harder to trigger
    const hasMaxQuestions = totalQuestions >= 40; // Increased from 35
    const tooManyQuestionsAtLevel =
      questionsAtCurrentLevel >= maxQuestionsPerLevel * 3; // Increased multiplier

    // LESS AGGRESSIVE: Stop on simple level bounce pattern
    const recentHistory = newHistory.slice(-6); // Look at more history
    const hasSimpleBounce =
      recentHistory.length >= 6 && // Require more questions
      recentHistory[0] === recentHistory[2] &&
      recentHistory[2] === recentHistory[4] && // Require 3 instances of same level
      recentHistory[1] === recentHistory[3] &&
      recentHistory[3] === recentHistory[5] && // Require 3 instances of other level
      recentHistory[0] !== recentHistory[1] &&
      totalQuestions >= Math.max(12, minQuestionsBeforeOscillationStop); // Increased minimum

    const shouldStop =
      hasMaxQuestions ||
      hasMaxPerformance ||
      hasMinPerformance ||
      isStableAtLevel ||
      (hasMinQuestions && hasOscillationPattern) ||
      (hasMinQuestions && tooManyQuestionsAtLevel) ||
      hasSimpleBounce; // New aggressive stopping condition

    // Debug logging
    if (totalQuestions >= 5) {
      console.log("🔄 Assessment Progress:", {
        totalQuestions,
        currentLevel,
        correctStreak,
        wrongStreak,
        levelStabilityCount,
        questionsAtCurrentLevel,
        shouldStop,
        reasons: {
          hasMaxQuestions,
          hasMaxPerformance,
          hasMinPerformance,
          isStableAtLevel,
          hasOscillationPattern,
          tooManyQuestionsAtLevel,
          hasSimpleBounce,
        },
      });
    }

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
    setShuffledQuestions({}); // Reset shuffled questions
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
                  <h2 className="text-md font-semibold">Baseline Assessment</h2>
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
                      Program Assessment
                    </h1>
                    {program && (
                      <div className="space-y-2">
                        <p className="text-lg font-semibold">{program.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Subject: {program.subject} • {program.totalLevels}{" "}
                          levels
                        </p>
                        <p className="text-sm text-muted-foreground text-pretty">
                          {program.description}
                        </p>
                      </div>
                    )}
                    {student && (
                      <p className="text-sm text-muted-foreground">
                        Student: {student.name} (Roll: {student.roll_no})
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      How it works:
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Questions are based on the selected program</li>
                      <li>
                        • Answer with ✓ (can read/correct) or ✗ (cannot
                        read/incorrect)
                      </li>
                      <li>
                        • The system adapts to find the student's appropriate
                        level
                      </li>
                      <li>• Assessment typically takes 10-15 questions</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={startTest}
                      className="flex-1"
                      disabled={!program}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Start Assessment
                    </Button>
                  </div>
                </div>
              )}
              {testState === "testing" && (
                <div className="space-y-6">
                  {/* Safety check for invalid level */}
                  {!getCurrentQuestion() ||
                  currentLevel >= (program?.levels?.length || 0) ? (
                    <div className="text-center space-y-4">
                      <div className="bg-red-100 p-4 rounded-lg">
                        <p className="text-red-800 font-semibold">
                          ⚠️ Assessment Error
                        </p>
                        <p className="text-red-600 text-sm">
                          Level {currentLevel + 1} is not available. Completing
                          assessment...
                        </p>
                      </div>
                      <Button onClick={completeTest} className="w-full">
                        Complete Assessment
                      </Button>
                    </div>
                  ) : (
                    <>
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
                          <CardTitle className="text-sm text-balance">
                            {program?.levels[currentLevel]?.title ||
                              `Level ${currentLevel + 1}`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Program-based question display */}
                          <div className="text-center space-y-4">
                            <div className="bg-gray-200 p-8 rounded-lg">
                              <p
                                className={`text-center leading-relaxed text-gray-800 ${getDynamicFontClasses(
                                  (getCurrentQuestion() as any)?.question || ""
                                )}`}
                              >
                                {renderQuestionWithLineBreaks(
                                  (getCurrentQuestion() as any)?.question || ""
                                )}
                              </p>
                            </div>
                          </div>

                          {!showFeedback ? (
                            <div className="grid grid-cols-2 gap-4">
                              {/* Cannot Read Button */}
                              <Button
                                variant="destructive"
                                className="h-20"
                                onClick={() => {
                                  console.log(
                                    "Red button (Cannot read) clicked!"
                                  );
                                  handleAnswer(false);
                                }}
                                aria-label="Cannot read"
                              >
                                <X
                                  className="h-24 w-24 stroke-[4]"
                                  aria-hidden="true"
                                />
                              </Button>
                              {/* Can Read Button */}
                              <Button
                                className="h-20 bg-green-600 text-white hover:bg-green-700"
                                onClick={() => {
                                  console.log(
                                    "Green button (Can read) clicked!"
                                  );
                                  handleAnswer(true);
                                }}
                                aria-label="Can read"
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
                                    Good!
                                  </>
                                ) : (
                                  <>
                                    <XCircle
                                      className="h-7 w-7"
                                      aria-hidden="true"
                                    />
                                    Noted
                                  </>
                                )}
                              </div>
                            </div>
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
                    </>
                  )}
                </div>
              )}{" "}
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
