"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import { mathData } from "@/data/math-data";
import { hindiData } from "@/data/hindi-data";

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
}

export function BaselineAssessmentModal({
  isOpen,
  onClose,
}: BaselineAssessmentModalProps) {
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
  const [oscillationCount, setOscillationCount] = useState(0);
  const [lastOscillationLevels, setLastOscillationLevels] = useState<
    [number, number] | null
  >(null);

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
    setOscillationCount(0);
    setLastOscillationLevels(null);
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

  const detectOscillation = (newLevel: number, history: number[]) => {
    if (history.length < 4) return false;

    const recent = history.slice(-6);

    if (recent.length >= 4) {
      const isSimpleOscillation =
        recent[recent.length - 4] === recent[recent.length - 2] &&
        recent[recent.length - 3] === recent[recent.length - 1] &&
        recent[recent.length - 4] !== recent[recent.length - 3];

      if (isSimpleOscillation) {
        const levels: [number, number] = [
          Math.min(recent[recent.length - 4], recent[recent.length - 3]),
          Math.max(recent[recent.length - 4], recent[recent.length - 3]),
        ];

        if (
          lastOscillationLevels &&
          lastOscillationLevels[0] === levels[0] &&
          lastOscillationLevels[1] === levels[1]
        ) {
          return { isOscillating: true, levels, isSamePattern: true };
        } else {
          return { isOscillating: true, levels, isSamePattern: false };
        }
      }
    }

    if (recent.length >= 6) {
      const isExtendedOscillation =
        recent[recent.length - 6] === recent[recent.length - 4] &&
        recent[recent.length - 4] === recent[recent.length - 2] &&
        recent[recent.length - 5] === recent[recent.length - 3] &&
        recent[recent.length - 3] === recent[recent.length - 1] &&
        recent[recent.length - 6] !== recent[recent.length - 5];

      if (isExtendedOscillation) {
        const levels: [number, number] = [
          Math.min(recent[recent.length - 6], recent[recent.length - 5]),
          Math.max(recent[recent.length - 6], recent[recent.length - 5]),
        ];
        return { isOscillating: true, levels, isSamePattern: true };
      }
    }

    return false;
  };

  const handleAnswer = (answer: string | boolean) => {
    const question = getCurrentQuestion();
    if (!question || !currentSubject) return;

    let correct = false;

    if (currentSubject === "math") {
      correct = answer === question.correct_answer;
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

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    const previousLevel = currentLevel;
    let newLevel = currentLevel;

    if (highPerformanceStreak >= 3 && currentLevel >= 6 && currentLevel < 9) {
      newLevel = currentLevel + 2;
      setCurrentLevel(newLevel);
      setCorrectStreak(0);
      setHighPerformanceStreak(0);
      setLevelStabilityCount(0);
    } else if (correctStreak >= 2 && currentLevel < 9) {
      newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      setCorrectStreak(0);
      setLevelStabilityCount(0);
    } else if (wrongStreak >= 2 && currentLevel > 0) {
      newLevel = currentLevel - 1;
      setCurrentLevel(newLevel);
      setWrongStreak(0);
      setLevelStabilityCount(0);
    } else if (previousLevel === currentLevel) {
      setLevelStabilityCount((prev) => prev + 1);
    }

    const newHistory = [...levelHistory, newLevel];
    setLevelHistory(newHistory);

    const oscillationResult = detectOscillation(newLevel, newHistory);
    if (oscillationResult) {
      if (oscillationResult.isSamePattern) {
        setOscillationCount((prev) => prev + 1);
      } else {
        setOscillationCount(1);
        setLastOscillationLevels(oscillationResult.levels);
      }
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswer("");
    setShowFeedback(false);

    const shouldStop =
      (levelStabilityCount >= 4 && totalQuestions >= 12) ||
      (currentLevel === 9 && correctStreak >= 2 && totalQuestions >= 15) ||
      (wrongStreak >= 4 && currentLevel === 0 && totalQuestions >= 10) ||
      (oscillationCount >= 2 && totalQuestions >= 12) ||
      totalQuestions >= 35;

    if (shouldStop) {
      if (oscillationCount >= 2 && lastOscillationLevels) {
        setCurrentLevel(lastOscillationLevels[0]);
      }
      completeTest();
    }
  };

  const completeTest = () => {
    if (!currentSubject) return;

    const result: TestResult = {
      subject: currentSubject,
      level: currentLevel + 1,
      totalQuestions,
      correctAnswers,
    };

    setResults((prev) => [...prev, result]);
    setTestState("completed");
  };

  const resetTest = () => {
    setTestState("intro");
    setCurrentSubject(null);
    setResults([]);
  };

  const handleClose = () => {
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
                  <p className="text-sm text-muted-foreground">
                    Adaptive Learning Test
                  </p>
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
                    <div className="flex justify-center mb-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-balance">
                      Baseline Assessment
                    </h1>
                    <p className="text-muted-foreground text-pretty">
                      Discover your current knowledge level with our adaptive
                      testing system
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-accent" />
                        How Adaptive Testing Works
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <p>
                          Questions adjust to your skill level automatically
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <p>Answer correctly → harder questions</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <p>Answer incorrectly → easier questions</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <p>
                          Your level is determined by consistent performance
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-center">
                      Choose a Subject
                    </h2>

                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => startTest("hindi")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Hindi Language</h3>
                              <p className="text-sm text-muted-foreground">
                                Reading & comprehension test
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => startTest("math")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <Calculator className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Mathematics</h3>
                              <p className="text-sm text-muted-foreground">
                                Problem solving & calculations
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {testState === "testing" && (
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Level {currentLevel + 1}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Question {totalQuestions + 1}
                      </Badge>
                    </div>
                    <Progress
                      value={Math.min((totalQuestions / 30) * 100, 100)}
                      className="h-2"
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-balance">
                        {currentSubject === "math"
                          ? mathData[currentLevel].title
                          : hindiData[currentLevel].title}
                      </CardTitle>
                      <CardDescription className="text-pretty">
                        {currentSubject === "math"
                          ? mathData[currentLevel].instructions
                          : hindiData[currentLevel].instructions}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentSubject === "math" ? (
                        <>
                          <div className="text-xl font-semibold text-center py-4 bg-muted/50 rounded-lg">
                            {getCurrentQuestion()?.question}
                          </div>

                          {!showFeedback ? (
                            <div className="grid grid-cols-2 gap-3">
                              {getCurrentQuestion()?.options.map(
                                (option: string, index: number) => (
                                  <Button
                                    key={index}
                                    variant={
                                      selectedAnswer === option
                                        ? "default"
                                        : "outline"
                                    }
                                    className="h-12 text-lg"
                                    onClick={() => {
                                      setSelectedAnswer(option);
                                      handleAnswer(option);
                                    }}
                                    disabled={showFeedback}
                                  >
                                    {option}
                                  </Button>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <div
                                className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                                  isCorrect ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle className="h-6 w-6" />
                                    Correct!
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-6 w-6" />
                                    Incorrect
                                  </>
                                )}
                              </div>
                              {!isCorrect && (
                                <p className="text-sm text-muted-foreground">
                                  Correct answer:{" "}
                                  {getCurrentQuestion()?.correct_answer}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-center py-8 bg-muted/50 rounded-lg">
                            {getCurrentQuestion()?.question}
                          </div>

                          {!showFeedback ? (
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground text-center">
                                Can the student read this correctly?
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <Button
                                  variant="outline"
                                  className="h-12 text-lg border-red-200 hover:bg-red-50 bg-transparent"
                                  onClick={() => handleAnswer(false)}
                                >
                                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                                  No
                                </Button>
                                <Button
                                  className="h-12 text-lg bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAnswer(true)}
                                >
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  Yes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <div
                                className={`flex items-center justify-center gap-2 text-lg font-semibold ${
                                  isCorrect ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle className="h-6 w-6" />
                                    Great job!
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-6 w-6" />
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

                  {totalQuestions >= 10 && !showFeedback && (
                    <Button
                      variant="outline"
                      className="w-full h-12 bg-transparent border-primary text-primary hover:bg-primary/10"
                      onClick={completeTest}
                    >
                      Complete Test Now
                    </Button>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-600">
                        {correctAnswers}
                      </p>
                      <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">
                        {currentLevel + 1}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current Level
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-accent">
                        {correctStreak}
                      </p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                  </div>
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
                      className="w-full h-12"
                      onClick={() => setTestState("intro")}
                    >
                      Take Another Assessment
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-12 bg-transparent"
                      onClick={handleClose}
                    >
                      Finish Assessment
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
