"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  X,
  Brain,
  CheckIcon,
} from "lucide-react";
import { createAssessment } from "@/services/assessments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Student } from "@/services/students";
import type { IProgram } from "@/services/programs";

// convert backend type names to our internal
const mapQuestionType = (qt: string) => {
  if (qt === "verbal_evaluation") return "verbal";
  if (qt === "one_word_answer") return "oneword";
  if (qt === "multiple_choice") return "mcq";
  return "verbal";
};

const splitQuestionLines = (text?: string) => {
  if (!text) return [];
  // Some questions encode line breaks as "/n" or escaped "\n".
  const normalized = text.replace(/\\n/g, "\n").replace(/\/n/g, "\n");
  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

type ModalState = "program-selection" | "testing" | "completed";

interface TestResult {
  subject: string;
  level: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  programs?: IProgram[];
  preSelectedProgramId?: string; // Program ID to auto-start
  onAssessmentComplete?: () => void;
}

export function BaselineAssessmentModal({
  isOpen,
  onClose,
  student,
  programs = [],
  preSelectedProgramId,
  onAssessmentComplete,
}: Props) {
  const { user } = useAuth();

  // global
  const [modalState, setModalState] = useState<ModalState>("program-selection");
  const [currentProgramIndex, setCurrentProgramIndex] = useState(-1);
  const [completedPrograms, setCompletedPrograms] = useState<Set<string>>(
    new Set()
  );
  const [programResults, setProgramResults] = useState<
    Record<string, TestResult>
  >({});

  // testing state
  const [currentLevel, setCurrentLevel] = useState(0);
  const [lastCompletedLevel, setLastCompletedLevel] = useState(-1); // Track last successfully completed level
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(
    null
  );
  const [oneWordInput, setOneWordInput] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswersForProgram, setCorrectAnswersForProgram] = useState(0);
  const [showQuickComplete, setShowQuickComplete] = useState(false);

  // algorithm refs - new 5-question batch system
  const levelQuestionsAnswered = useRef(0); // 0-10 questions per level
  const levelCorrectAnswers = useRef(0); // correct answers in current level
  const levelWrongAnswers = useRef(0); // wrong answers in current level (max 3)

  // shuffle question cache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [shuffledCache, setShuffledCache] = useState<Record<string, any>>({});

  // reset modal when open
  useEffect(() => {
    if (!isOpen) return;
    setModalState("program-selection");
    setCurrentProgramIndex(-1);
    setCompletedPrograms(new Set());
    setProgramResults({});
    setShuffledCache({});
  }, [isOpen]);

  // Auto-start pre-selected program
  useEffect(() => {
    if (!isOpen || !preSelectedProgramId || !student || programs.length === 0)
      return;
    if (currentProgramIndex >= 0) return; // Already started a program

    const programIndex = programs.findIndex(
      (p) => p._id === preSelectedProgramId
    );

    if (programIndex >= 0) {
      // Small delay to ensure state is reset first
      const timer = setTimeout(() => {
        startProgram(programIndex);
      }, 100);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preSelectedProgramId]);

  const getActiveProgram = () => {
    if (currentProgramIndex < 0) return null;
    return programs[currentProgramIndex];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shuffle = (arr: any[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const ensureShuffled = (programId: string, level: number) => {
    // ✅ If level exceeds program levels – return empty array and stop later
    const prog = programs.find((p) => p._id === programId);
    const lvl = prog?.levels?.[level];
    if (!lvl) return []; // prevents crash

    if (shuffledCache?.[programId]?.[level]) {
      return shuffledCache[programId][level];
    }

    const questions = Array.isArray(lvl.assessmentQuestions)
      ? lvl.assessmentQuestions
      : [];

    const shuffled = shuffle(questions);

    setShuffledCache((prev) => ({
      ...prev,
      [programId]: { ...(prev[programId] || {}), [level]: shuffled },
    }));

    return shuffled;
  };

  const getCurrentQuestion = () => {
    const active = getActiveProgram();
    if (!active) return null;

    // ✅ Level overflow = student conquered all levels → end program
    if (currentLevel >= active.levels.length) {
      finalizeProgram();
      return null;
    }

    const shuffled = ensureShuffled(active._id, currentLevel);

    // ✅ No questions = auto finalize
    if (!shuffled || shuffled.length === 0) {
      finalizeProgram();
      return null;
    }

    // Show questions sequentially: 0-4 (batch 1), then 5-9 (batch 2)
    const idx = levelQuestionsAnswered.current;
    if (idx < shuffled.length) {
      return shuffled[idx];
    }

    // If we've answered all available questions, end
    return null;
  };

  const startProgram = (i: number) => {
    if (!student) {
      toast.error("Select student first");
      return;
    }
    setCurrentProgramIndex(i);
    setModalState("testing");
    setCurrentLevel(0);
    setLastCompletedLevel(-1); // Reset last completed level
    setOneWordInput("");
    setTotalQuestions(0);
    setCorrectAnswersForProgram(0);

    // Reset level counters
    levelQuestionsAnswered.current = 0;
    levelCorrectAnswers.current = 0;
    levelWrongAnswers.current = 0;

    toast.success(`Starting ${programs[i].name}`);
  };

  const evaluateLevel = async () => {
    const correct = levelCorrectAnswers.current;
    const wrong = levelWrongAnswers.current;
    const answered = levelQuestionsAnswered.current;
    const active = getActiveProgram();
    if (!active) return;

    // Termination condition: 3 wrong answers in current level → end test
    if (wrong >= 3) {
      await finalizeProgram();
      return;
    }

    // Promotion condition: 8 correct answers → move to next level
    if (correct >= 8) {
      // Student passed current level, save it as last completed
      setLastCompletedLevel(currentLevel);
      setCurrentLevel((l) => l + 1);
      // Reset counters for new level
      levelQuestionsAnswered.current = 0;
      levelCorrectAnswers.current = 0;
      levelWrongAnswers.current = 0;
      setShowQuickComplete(false);
      return;
    }

    // After 10 questions: if 8+ correct → promote, if <8 correct → end test
    if (answered >= 10) {
      if (correct >= 8) {
        // Student passed current level, save it as last completed
        setLastCompletedLevel(currentLevel);
        // Promote to next level
        setCurrentLevel((l) => l + 1);
        levelQuestionsAnswered.current = 0;
        levelCorrectAnswers.current = 0;
        levelWrongAnswers.current = 0;
        setShowQuickComplete(false);
      } else {
        // Stay at current level and end test
        await finalizeProgram();
      }
      return;
    }
  };

  const finalizeProgram = async () => {
    const active = getActiveProgram();
    if (!active) return;

    // lastCompletedLevel is the index of the last level they passed
    // If they passed level 1 (index 0), their knowledge level is 1
    // If they didn't pass any level (lastCompletedLevel === -1), they're at level 0 (displayed as level 1)
    // Example: Pass level 1 (index 0) → lastCompletedLevel = 0 → knowledge level = 1
    //          Fail level 2 → lastCompletedLevel still 0 → knowledge level = 1
    const knowledgeLevel = lastCompletedLevel >= 0 ? lastCompletedLevel + 1 : 1;
    const result: TestResult = {
      subject: active.subject,
      level: knowledgeLevel, // Already 1-indexed
      totalQuestions,
      correctAnswers: correctAnswersForProgram,
    };

    try {
      await createAssessment({
        student: student!._id,
        school: student!.schoolId._id,
        mentor: user?.id || "",
        subject: active.subject,
        level: result.level,
        program: active._id, // Add program ID
      });
      toast.success(`${active.name}: Level ${result.level} saved`);
    } catch {
      toast.error("Failed to save result");
    }

    setProgramResults((p) => ({ ...p, [active._id]: result }));
    setCompletedPrograms((p) => new Set([...p, active._id]));

    const all =
      programs.length > 0 && completedPrograms.size + 1 === programs.length;
    if (all) setModalState("completed");
    else {
      setModalState("program-selection");
      setCurrentProgramIndex(-1);
    }
  };

  const handleAnswer = (correct: boolean) => {
    setLastAnswerCorrect(correct);
    setShowFeedback(true);

    setTotalQuestions((n) => n + 1);
    levelQuestionsAnswered.current++;

    if (correct) {
      levelCorrectAnswers.current++;
      setCorrectAnswersForProgram((c) => c + 1);
    } else {
      levelWrongAnswers.current++;
    }

    // Update quick complete button visibility
    setShowQuickComplete(levelQuestionsAnswered.current >= 5);

    setTimeout(async () => {
      setShowFeedback(false);
      setOneWordInput("");

      const answered = levelQuestionsAnswered.current;
      const correct = levelCorrectAnswers.current;
      const wrong = levelWrongAnswers.current;

      // Check termination: 3 wrong in current level → end test immediately
      if (wrong >= 3) {
        await evaluateLevel();
        return;
      }

      // After first 5 questions: if all 5 correct → promote immediately
      if (answered === 5 && correct === 5) {
        await evaluateLevel();
        return;
      }

      // Check promotion: 8 correct → promote immediately (can happen at any point)
      if (correct >= 8) {
        await evaluateLevel();
        return;
      }

      // After 10 questions: evaluate final result (promote if 8+, end if <8)
      if (answered === 10) {
        await evaluateLevel();
        return;
      }
    }, 600);
  };

  const active = getActiveProgram();
  const question = getCurrentQuestion();
  const qt = mapQuestionType(question?.questionType);
  const questionLines = splitQuestionLines(question?.questionText);
  const hasMultipleLines = questionLines.length > 1;

  if (!isOpen) return null;

  const closeAll = async () => {
    if (modalState === "testing") await finalizeProgram();
    // Wait for assessment complete callback to finish refreshing data
    if (onAssessmentComplete) {
      await onAssessmentComplete();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* HEADER - Fixed at top */}
      <div className="flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate">
              Baseline Assessment
            </h2>
            {student && (
              <p className="text-xs text-muted-foreground truncate">
                {student.name} (Roll {student.roll_no})
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={closeAll}
          className="flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* CONTENT - Centered and Full Height */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* PROGRAM LIST */}
          {modalState === "program-selection" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold">Select Program</h2>
              </div>

              <div className="space-y-3">
                {programs.map((p, i) => {
                  const done = completedPrograms.has(p._id);
                  const res = programResults[p._id];
                  return (
                    <Card
                      key={p._id}
                      className={done ? "bg-green-50 border-green-200" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-2 items-center mb-1">
                              <BookOpen
                                className={`w-4 h-4 flex-shrink-0 ${
                                  done ? "text-green-600" : "text-blue-600"
                                }`}
                              />
                              <span className="font-semibold text-base">
                                {p.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {p.subject} • {p.levels?.length || 0} levels
                            </p>
                            {done && res && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-700 border-green-300 text-xs"
                              >
                                Completed: Level {res.level}
                              </Badge>
                            )}
                          </div>
                          {!done ? (
                            <Button
                              size="sm"
                              onClick={() => startProgram(i)}
                              className="flex-shrink-0"
                            >
                              Start
                            </Button>
                          ) : (
                            <Badge className="bg-green-600 flex-shrink-0">
                              Done
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TESTING SCREEN */}
          {modalState === "testing" && (
            <div className="flex flex-col h-full min-h-[600px]">
              {/* Progress Bar */}
              <div className="flex justify-between items-center mb-6">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Level {currentLevel + 1}
                </Badge>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs px-3 py-1">
                    Q{levelQuestionsAnswered.current + 1}
                    {levelQuestionsAnswered.current < 5 ? "/5" : "/10"}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-3 py-1">
                    ✓ {levelCorrectAnswers.current} | ✗{" "}
                    {levelWrongAnswers.current}
                  </Badge>
                </div>
              </div>

              {/* Question Card - Takes most of the space */}
              <Card className="border-2 flex-1 flex flex-col mb-6">
                <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-center space-y-8">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {active?.levels?.[currentLevel]?.title ??
                        `Level ${currentLevel + 1}`}
                    </p>
                  </div>

                  {/* Question Display - Large and centered with Devanagari font */}
                  <div
                    className={`bg-gray-100 dark:bg-gray-800 p-8 md:p-12 rounded-lg text-center break-words font-bold font-devanagari ${
                      hasMultipleLines
                        ? "text-3xl md:text-4xl"
                        : "text-5xl md:text-7xl lg:text-8xl"
                    } min-h-[200px] md:min-h-[300px] flex items-center justify-center`}
                  >
                    <div>
                      {questionLines.map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < questionLines.length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* FEEDBACK */}
                  {showFeedback ? (
                    <div className="text-center py-6">
                      <div
                        className={`text-3xl md:text-4xl font-bold ${
                          lastAnswerCorrect ? "text-green-600" : "text-red-600"
                        } flex items-center justify-center gap-3`}
                      >
                        {lastAnswerCorrect ? (
                          <>
                            <CheckCircle className="w-8 h-8 md:w-10 md:h-10" />{" "}
                            Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="w-8 h-8 md:w-10 md:h-10" />{" "}
                            Noted
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* QUESTION TYPES */}
                      {qt === "verbal" && (
                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                          <Button
                            variant="destructive"
                            className="h-20 md:h-24 text-xl"
                            onClick={() => handleAnswer(false)}
                          >
                            <X
                              className="w-10 h-10 md:w-12 md:h-12"
                              strokeWidth={3}
                            />
                          </Button>
                          <Button
                            className="h-20 md:h-24 bg-green-600 hover:bg-green-700 text-xl"
                            onClick={() => handleAnswer(true)}
                          >
                            <CheckIcon
                              className="w-10 h-10 md:w-12 md:h-12"
                              strokeWidth={3}
                            />
                          </Button>
                        </div>
                      )}

                      {qt === "oneword" && (
                        <div className="space-y-4 max-w-md mx-auto">
                          <Input
                            value={oneWordInput}
                            onChange={(e) => setOneWordInput(e.target.value)}
                            placeholder="Type your answer"
                            className="text-lg h-14"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const accepted =
                                  question.acceptedAnswers?.map((a: string) =>
                                    a.toLowerCase().trim()
                                  ) || [];
                                const ok = accepted.includes(
                                  oneWordInput.trim().toLowerCase()
                                );
                                handleAnswer(ok);
                              }
                            }}
                          />
                          <Button
                            className="w-full h-14 text-lg"
                            onClick={() => {
                              const accepted =
                                question.acceptedAnswers?.map((a: string) =>
                                  a.toLowerCase().trim()
                                ) || [];
                              const ok = accepted.includes(
                                oneWordInput.trim().toLowerCase()
                              );
                              handleAnswer(ok);
                            }}
                          >
                            Submit
                          </Button>
                        </div>
                      )}

                      {qt === "mcq" && (
                        <div className="space-y-3 max-w-lg mx-auto">
                          {question.options?.map((opt: string, idx: number) => (
                            <Button
                              key={idx}
                              variant="outline"
                              className="w-full py-6 text-lg md:text-xl text-left justify-start h-auto"
                              onClick={() =>
                                handleAnswer(
                                  idx === question.correctOptionIndex
                                )
                              }
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* End Assessment Button - Fixed at bottom */}
              {showQuickComplete && !showFeedback && (
                <div className="mt-auto">
                  <Button
                    className="w-full h-14 text-lg"
                    variant="outline"
                    onClick={finalizeProgram}
                  >
                    End Assessment
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* FINAL SCREEN */}
          {modalState === "completed" && (
            <div className="space-y-4 py-4">
              <div className="text-center py-4">
                <Trophy className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold">Assessment Complete!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  All programs have been assessed
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(programResults).map(([pid, res]) => {
                  const p = programs.find((x) => x._id === pid);
                  return (
                    <Card key={pid} className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold text-base">{p?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {res.correctAnswers}/{res.totalQuestions} correct
                              answers
                            </p>
                          </div>
                          <Badge className="bg-green-600 text-sm">
                            Level {res.level}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button className="w-full h-12 text-lg mt-6" onClick={closeAll}>
                Finish
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
