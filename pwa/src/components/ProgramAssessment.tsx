import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  X,
  CheckIcon,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { useProgramAssessment } from "@/hooks/useProgramAssessment";
import type { Student } from "@/services/students";

interface ProgramAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  programId: string;
  programName?: string;
  onAssessmentComplete?: () => void;
}

export function ProgramAssessmentModal({
  isOpen,
  onClose,
  student,
  programId,
  programName = "Program",
  onAssessmentComplete,
}: ProgramAssessmentProps) {
  const [testState, setTestState] = useState<"intro" | "testing" | "completed">(
    "intro"
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const {
    assessment,
    currentQuestion,
    stats,
    loading,
    error,
    submitting,
    startAssessment,
    submitQuestionAnswer,
    pauseCurrentAssessment,
    resumeCurrentAssessment,
    resetState,
    clearError,
  } = useProgramAssessment();

  useEffect(() => {
    if (isOpen) {
      resetState();
      setTestState("intro");
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleStartAssessment = async () => {
    if (!student) {
      toast.error("No student selected");
      return;
    }

    const assessmentData = await startAssessment({
      programId,
      studentId: student._id,
      schoolId: student.schoolId._id,
    });

    if (assessmentData) {
      setTestState("testing");
      toast.success("Assessment started successfully!");
    }
  };

  const handleAnswer = async (answer: boolean) => {
    if (!assessment || submitting) return;

    setIsCorrect(answer);
    setShowFeedback(true);

    setTimeout(async () => {
      const isComplete = await submitQuestionAnswer(assessment._id, answer);

      setShowFeedback(false);
      setIsCorrect(null);

      if (isComplete) {
        setTestState("completed");
        onAssessmentComplete?.();
        toast.success("Assessment completed!");
      }
    }, 1500);
  };

  const handlePauseAssessment = async () => {
    if (!assessment) return;

    await pauseCurrentAssessment(assessment._id);
    toast.info("Assessment paused");
  };

  const handleResumeAssessment = async () => {
    if (!assessment) return;

    await resumeCurrentAssessment(assessment._id);
    toast.success("Assessment resumed");
  };

  const getProgressPercentage = () => {
    if (!stats) return 0;
    // Estimate progress based on questions asked and typical assessment length
    const estimatedTotalQuestions = 15;
    return Math.min((stats.totalQuestions / estimatedTotalQuestions) * 100, 90);
  };

  const renderIntroScreen = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {programName} Assessment
          </h2>
          <p className="text-gray-600 mt-2">
            {student ? `Assessment for ${student.name}` : "Student Assessment"}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Questions will be presented based on the selected program</li>
          <li>
            • Answer with ✓ (correct/can read) or ✗ (incorrect/cannot read)
          </li>
          <li>
            • The system will adapt to find the student's appropriate level
          </li>
          <li>• Assessment typically takes 10-15 questions</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleStartAssessment}
          className="flex-1"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Assessment
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderTestingScreen = () => (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <span className="font-medium">{programName}</span>
        </div>
        <div className="flex items-center gap-2">
          {assessment?.status === "paused" ? (
            <Badge variant="secondary">Paused</Badge>
          ) : (
            <Badge variant="default">In Progress</Badge>
          )}
          {currentQuestion && (
            <Badge variant="outline">Level {currentQuestion.level}</Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {stats && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{stats.totalQuestions} questions answered</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>
      )}

      {/* Question display */}
      {currentQuestion && !currentQuestion.isComplete ? (
        <div className="space-y-6">
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-lg font-medium text-gray-800">
                  Can the student read this?
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-xl font-medium text-center">
                    {currentQuestion.questionText}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!showFeedback ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Cannot Read Button */}
              <Button
                variant="destructive"
                className="h-20"
                onClick={() => handleAnswer(false)}
                disabled={submitting}
                aria-label="Cannot read"
              >
                <X className="h-24 w-24 stroke-[4]" aria-hidden="true" />
              </Button>
              {/* Can Read Button */}
              <Button
                className="h-20 bg-green-600 text-white hover:bg-green-700"
                onClick={() => handleAnswer(true)}
                disabled={submitting}
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
                    <CheckCircle className="h-7 w-7" />
                    Good!
                  </>
                ) : (
                  <>
                    <XCircle className="h-7 w-7" />
                    Noted
                  </>
                )}
              </div>
            </div>
          )}

          {/* Control buttons */}
          <div className="flex gap-2 justify-center">
            {assessment?.status === "in-progress" ? (
              <Button
                variant="outline"
                onClick={handlePauseAssessment}
                disabled={loading}
                size="sm"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleResumeAssessment}
                disabled={loading}
                size="sm"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading next question...</p>
        </div>
      )}
    </div>
  );

  const renderCompletedScreen = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Trophy className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Assessment Complete!
          </h2>
          <p className="text-gray-600 mt-2">
            {student?.name}'s {programName} assessment has been completed.
          </p>
        </div>
      </div>

      {stats && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Results Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Final Level</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.finalLevel || currentQuestion?.finalLevel || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Questions Asked</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Correct Answers</p>
              <p className="text-lg font-semibold text-green-600">
                {stats.correctAnswers}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Accuracy</p>
              <p className="text-lg font-semibold text-blue-600">
                {Math.round(
                  (stats.correctAnswers / stats.totalQuestions) * 100
                )}
                %
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetState();
            setTestState("intro");
          }}
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Start New Assessment
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Program Assessment
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testState === "intro" && renderIntroScreen()}
          {testState === "testing" && renderTestingScreen()}
          {testState === "completed" && renderCompletedScreen()}
        </CardContent>
      </Card>
    </div>
  );
}
