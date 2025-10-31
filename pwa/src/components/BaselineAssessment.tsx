"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
  onAssessmentComplete?: () => void;
}

export function BaselineAssessmentModal({
  isOpen,
  onClose,
  student,
  programs = [],
  onAssessmentComplete,
}: Props) {
  const { user } = useAuth();

  // global
  const [modalState, setModalState] = useState<ModalState>("program-selection");
  const [currentProgramIndex, setCurrentProgramIndex] = useState(-1);
  const [completedPrograms, setCompletedPrograms] = useState<Set<string>>(new Set());
  const [programResults, setProgramResults] = useState<Record<string, TestResult>>({});

  // testing state
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [oneWordInput, setOneWordInput] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswersForProgram, setCorrectAnswersForProgram] = useState(0);
  const [showQuickComplete, setShowQuickComplete] = useState(false);

  // algorithm refs
  const levelQuestionsAnswered = useRef(0);
  const levelCorrectAnswers = useRef(0);
  const oscillationCycles = useRef(0);
  const lastDirection = useRef<"up" | "down" | null>(null);
  const lastSuccessfulLevel = useRef(0);

  // shuffle question cache
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

  const getActiveProgram = () => {
    if (currentProgramIndex < 0) return null;
    return programs[currentProgramIndex];
  };

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

  const idx = levelQuestionsAnswered.current;
  if (idx < 3) return shuffled[idx];

  return shuffled[3] ?? shuffled[2];
};


  const startProgram = (i: number) => {
    if (!student) {
      toast.error("Select student first");
      return;
    }
    setCurrentProgramIndex(i);
    setModalState("testing");
    setCurrentLevel(0);
    setOneWordInput("");
    setTotalQuestions(0);
    setCorrectAnswersForProgram(0);

    levelQuestionsAnswered.current = 0;
    levelCorrectAnswers.current = 0;
    oscillationCycles.current = 0;
    lastDirection.current = null;
    lastSuccessfulLevel.current = 0;

    toast.success(`Starting ${programs[i].name}`);
  };

  const evaluateLevel = async () => {
    const score = levelCorrectAnswers.current;
    const active = getActiveProgram();
    if (!active) return;

    if (score >= 3) {
      // promote
      if (currentLevel > lastSuccessfulLevel.current) {
        oscillationCycles.current = 0;
      }
      lastSuccessfulLevel.current = currentLevel;
      lastDirection.current = "up";
      setCurrentLevel((l) => l + 1);
    } else {
      // demote or end
      if (currentLevel === 0 && score === 0) {
        await finalizeProgram();
        return;
      }

      if (lastDirection.current === "up") oscillationCycles.current++;
      lastDirection.current = "down";

      setCurrentLevel((l) => Math.max(0, l - 1));

      if (oscillationCycles.current >= 2) {
        setCurrentLevel(lastSuccessfulLevel.current);
        await finalizeProgram();
        return;
      }
    }

    levelQuestionsAnswered.current = 0;
    levelCorrectAnswers.current = 0;

    if (totalQuestions >= 40) {
      await finalizeProgram();
    }
  };

  const finalizeProgram = async () => {
    const active = getActiveProgram();
    if (!active) return;

    const result: TestResult = {
      subject: active.subject,
      level: lastSuccessfulLevel.current + 1,
      totalQuestions,
      correctAnswers: correctAnswersForProgram,
    };

    try {
      await createAssessment({
        student: student!._id,
        school: student!.schoolId._id,
        mentor: user?.id || '',
        subject: active.subject,
        level: result.level,
      });
      toast.success(`${active.name}: Level ${result.level} saved`);
    } catch (e) {
      toast.error("Failed to save result");
    }

    setProgramResults((p) => ({ ...p, [active._id]: result }));
    setCompletedPrograms((p) => new Set([...p, active._id]));

    const all = programs.length > 0 && completedPrograms.size + 1 === programs.length;
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
    if (correct) {
      levelCorrectAnswers.current++;
      setCorrectAnswersForProgram((c) => c + 1);
    }

    levelQuestionsAnswered.current++;

    setTimeout(async () => {
      setShowFeedback(false);
      setOneWordInput("");

      // 2/3 -> ask 4th
      if (
        levelQuestionsAnswered.current === 3 &&
        levelCorrectAnswers.current === 2
      ) {
        levelQuestionsAnswered.current = 3;
        return;
      }

      if (levelQuestionsAnswered.current >= 3) {
        await evaluateLevel();
      }
    }, 600);
  };

  const active = getActiveProgram();
  const question = getCurrentQuestion();
  const qt = mapQuestionType(question?.questionType);

  useEffect(() => {
    setShowQuickComplete(totalQuestions >= 3);
  }, [totalQuestions]);

  if (!isOpen) return null;

  const closeAll = async () => {
    if (modalState === "testing") await finalizeProgram();
    onAssessmentComplete?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl">

          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-md font-semibold">Baseline Assessment</h2>
                {student && (
                  <p className="text-sm text-muted-foreground">
                    {student.name} (Roll {student.roll_no})
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={closeAll}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6">
            {/* PROGRAM LIST */}
            {modalState === "program-selection" && (
              <div className="space-y-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h2 className="text-xl font-bold mb-1">Select Program</h2>
                </div>

                {programs.map((p, i) => {
                  const done = completedPrograms.has(p._id);
                  const res = programResults[p._id];
                  return (
                    <Card key={p._id} className={done ? "bg-green-50" : ""}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <div className="flex gap-2 items-center">
                            <BookOpen className={done ? "text-green-600" : "text-blue-600"} />
                            <span className="font-semibold">{p.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {p.subject} • {p.levels?.length || 0} levels
                          </p>
                          {done && (
                            <p className="text-sm text-green-600">
                              Level {res?.level}
                            </p>
                          )}
                        </div>

                        {!done ? (
                          <Button size="sm" onClick={() => startProgram(i)}>Start</Button>
                        ) : (
                          <Badge className="bg-green-600">Done</Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                <Button variant="outline" className="w-full" onClick={closeAll}>
                  Close
                </Button>
              </div>
            )}

            {/* TESTING SCREEN */}
            {modalState === "testing" && (
              <div>
                <div className="flex justify-between mb-2">
                  <Badge>Level {currentLevel + 1}</Badge>
                  <Badge>Q{totalQuestions + 1}</Badge>
                </div>

                <Card>
<CardTitle>
  {active?.levels?.[currentLevel]?.title ?? `Level ${currentLevel + 1}`}
</CardTitle>
                  <CardContent className="space-y-4">
                    <div className={`bg-gray-100 p-5 rounded text-center break-words font-bold ${question?.questionText?.includes('\n') ? 'text-xl' : 'text-5xl'}`}>
                      {(question?.questionText?.split('\n') || []).map((line: string, i: number) => (
                        <span key={i}>
                          {line}
                          {i < (question?.questionText?.split('\n') || []).length - 1 && <br />}
                        </span>
                      ))}
                    </div>

                    {/* FEEDBACK */}
                    {showFeedback ? (
                      <div className="text-center text-xl font-semibold">
                        {lastAnswerCorrect ? (
                          <span className="text-green-600 flex justify-center gap-2">
                            <CheckCircle /> Correct
                          </span>
                        ) : (
                          <span className="text-red-600 flex justify-center gap-2">
                            <XCircle /> Noted
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* QUESTION TYPES */}
                        {qt === "verbal" && (
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              variant="destructive"
                              className="h-20"
                              onClick={() => handleAnswer(false)}
                            >
                              <X className="h-15 w-12" strokeWidth={5} />
                            </Button>
                            <Button
                              className="h-20 bg-green-600"
                              onClick={() => handleAnswer(true)}
                            >
                              <CheckIcon className="h-12 w-12" strokeWidth={5} />
                            </Button>
                          </div>
                        )}

                        {qt === "oneword" && (
                          <>
                            <Input
                              value={oneWordInput}
                              onChange={(e) => setOneWordInput(e.target.value)}
                              placeholder="Type answer"
                            />
                            <Button className="w-full" onClick={() => {
                              const accepted = question.acceptedAnswers?.map((a:string)=>a.toLowerCase().trim())||[];
                              const ok = accepted.includes(oneWordInput.trim().toLowerCase());
                              handleAnswer(ok);
                            }}>
                              Submit
                            </Button>
                          </>
                        )}

                        {qt === "mcq" && (
                          <div className="space-y-2">
                            {question.options?.map((opt: string, idx: number) => (
                              <Button
                                key={idx}
                                variant="outline"
                                className="w-full py-4 text-lg"
                                onClick={() => handleAnswer(idx === question.correctOptionIndex)}
                              >
                                {opt}
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {showQuickComplete && !showFeedback && (
                  <Button className="w-full mt-4" variant="outline" onClick={finalizeProgram}>
                    End Program
                  </Button>
                )}
              </div>
            )}

            {/* FINAL SCREEN */}
            {modalState === "completed" && (
              <div className="space-y-6">
                <div className="text-center">
                  <Trophy className="h-10 w-10 text-green-600 mx-auto" />
                  <h2 className="text-xl font-bold mt-2">Assessment Complete</h2>
                </div>

                {Object.entries(programResults).map(([pid, res]) => {
                  const p = programs.find((x) => x._id === pid);
                  return (
                    <Card key={pid}>
                      <CardContent className="p-4 flex justify-between">
                        <div>
                          <p className="font-semibold">{p?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {res.correctAnswers}/{res.totalQuestions} correct
                          </p>
                        </div>
                        <Badge>Level {res.level}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}

                <Button className="w-full" variant="outline" onClick={closeAll}>
                  Finish
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
