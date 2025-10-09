import { Request, Response } from "express";
import { AuthRequest } from "../types/auth";
import {
  ProgramAssessment,
  AssessmentStatus,
} from "../models/ProgramAssessmentModel";
import Program from "../models/ProgramModel";
import logger from "../utils/logger";

// Interface for creating a new program assessment
interface CreateProgramAssessmentRequest {
  studentId: string;
  schoolId: string;
  programId: string;
  config?: {
    randomizeQuestions?: boolean;
    maxQuestionsPerLevel?: number;
    oscillationTolerance?: number;
    minQuestionsBeforeOscillationStop?: number;
  };
}

// Interface for submitting an answer
interface SubmitAnswerRequest {
  assessmentId: string;
  questionId: string;
  userAnswer: string | boolean | number;
  timeSpent: number; // in seconds
}

// Interface for getting next question response
interface NextQuestionResponse {
  hasNextQuestion: boolean;
  question?: {
    id: string;
    text: string;
    type: string;
    options?: string[];
    levelNumber: number;
    points: number;
  };
  currentLevel: number;
  progress: {
    totalQuestions: number;
    currentQuestionIndex: number;
    accuracy: number;
  };
  shouldStop?: boolean;
  stopReason?: string;
}

export class ProgramAssessmentController {
  // Create a new program-based assessment
  static async createAssessment(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        studentId,
        schoolId,
        programId,
        config,
      }: CreateProgramAssessmentRequest = req.body;
      const mentorId = req.user?.id;

      if (!mentorId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!studentId || !schoolId || !programId) {
        res.status(400).json({
          message: "Missing required fields: studentId, schoolId, programId",
        });
        return;
      }

      // Verify program exists
      const program = await Program.findById(programId);
      if (!program) {
        res.status(404).json({ message: "Program not found" });
        return;
      }

      // Check if there's already an active assessment for this student and program
      const existingAssessment = await ProgramAssessment.findOne({
        student: studentId,
        program: programId,
        status: AssessmentStatus.IN_PROGRESS,
      });

      if (existingAssessment) {
        res.status(409).json({
          message:
            "Active assessment already exists for this student and program",
          assessmentId: existingAssessment._id,
        });
        return;
      }

      // Create new assessment
      const assessment = await (ProgramAssessment as any).createAssessment(
        studentId,
        schoolId,
        mentorId,
        programId,
        config
      );

      logger.info(
        `Created program assessment ${assessment._id} for student ${studentId}`
      );

      res.status(201).json({
        message: "Assessment created successfully",
        assessment: {
          id: assessment._id,
          subject: assessment.subject,
          totalQuestions: assessment.questionPool.length,
          status: assessment.status,
          startTime: assessment.startTime,
        },
      });
    } catch (error) {
      logger.error("Error creating program assessment:", error);
      res.status(500).json({
        message: "Error creating assessment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get current question for assessment
  static async getCurrentQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const assessment = await ProgramAssessment.findById(assessmentId);
      if (!assessment) {
        res.status(404).json({ message: "Assessment not found" });
        return;
      }

      if (assessment.status !== AssessmentStatus.IN_PROGRESS) {
        res.status(400).json({
          message: "Assessment is not in progress",
          status: assessment.status,
        });
        return;
      }

      // Check if assessment should stop
      const stopCheck = (assessment as any).shouldStopAssessment();
      if (stopCheck.shouldStop) {
        (assessment as any).completeAssessment(
          stopCheck.finalLevel,
          stopCheck.reason
        );
        await assessment.save();

        res.json({
          hasNextQuestion: false,
          shouldStop: true,
          stopReason: stopCheck.reason,
          finalResults: {
            finalLevel: assessment.finalLevel,
            totalQuestions: assessment.totalQuestions,
            totalCorrectAnswers: assessment.totalCorrectAnswers,
            accuracy: assessment.accuracy,
            duration: assessment.totalDuration,
          },
        });
        return;
      }

      // Get current question
      const currentIndex = assessment.currentQuestionIndex;
      if (currentIndex >= assessment.questionPool.length) {
        // No more questions available
        (assessment as any).completeAssessment(
          assessment.algorithmState.currentLevel,
          "All questions completed"
        );
        await assessment.save();

        res.json({
          hasNextQuestion: false,
          shouldStop: true,
          stopReason: "All questions completed",
          finalResults: {
            finalLevel: assessment.finalLevel,
            totalQuestions: assessment.totalQuestions,
            totalCorrectAnswers: assessment.totalCorrectAnswers,
            accuracy: assessment.accuracy,
            duration: assessment.totalDuration,
          },
        });
        return;
      }

      const currentQuestion = assessment.questionPool[currentIndex];

      const response: NextQuestionResponse = {
        hasNextQuestion: true,
        question: {
          id: currentQuestion._id?.toString() || currentIndex.toString(),
          text: currentQuestion.questionText,
          type: currentQuestion.questionType,
          options: currentQuestion.options,
          levelNumber: currentQuestion.levelNumber ?? 1,
          points: currentQuestion.points || 1,
        },
        currentLevel: assessment.algorithmState.currentLevel,
        progress: {
          totalQuestions: assessment.totalQuestions,
          currentQuestionIndex: currentIndex + 1,
          accuracy: assessment.accuracy,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error getting current question:", error);
      res.status(500).json({
        message: "Error retrieving question",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Submit answer for current question
  static async submitAnswer(req: Request, res: Response): Promise<void> {
    try {
      const {
        assessmentId,
        questionId,
        userAnswer,
        timeSpent,
      }: SubmitAnswerRequest = req.body;

      if (
        !assessmentId ||
        !questionId ||
        userAnswer === undefined ||
        !timeSpent
      ) {
        res.status(400).json({
          message:
            "Missing required fields: assessmentId, questionId, userAnswer, timeSpent",
        });
        return;
      }

      const assessment = await ProgramAssessment.findById(assessmentId);
      if (!assessment) {
        res.status(404).json({ message: "Assessment not found" });
        return;
      }

      if (assessment.status !== AssessmentStatus.IN_PROGRESS) {
        res.status(400).json({
          message: "Assessment is not in progress",
          status: assessment.status,
        });
        return;
      }

      // Get current question
      const currentIndex = assessment.currentQuestionIndex;
      const currentQuestion = assessment.questionPool[currentIndex];

      if (!currentQuestion || currentQuestion._id?.toString() !== questionId) {
        res
          .status(400)
          .json({ message: "Invalid question ID for current state" });
        return;
      }

      // Evaluate answer
      let isCorrect = false;
      if (currentQuestion.questionType === "multiple_choice") {
        isCorrect =
          userAnswer ===
          currentQuestion.options?.[currentQuestion.correctOptionIndex || 0];
      } else if (currentQuestion.questionType === "one_word_answer") {
        const userAnswerStr = String(userAnswer).toLowerCase().trim();
        isCorrect =
          currentQuestion.acceptedAnswers?.some(
            (answer) => answer.toLowerCase().trim() === userAnswerStr
          ) || false;
      } else if (currentQuestion.questionType === "verbal_evaluation") {
        // For verbal evaluation, the answer should be a boolean
        isCorrect = Boolean(userAnswer);
      }

      const pointsEarned = isCorrect ? currentQuestion.points || 1 : 0;

      // Add response to assessment
      (assessment as any).addResponse(
        questionId,
        currentQuestion.levelNumber ?? 1,
        currentQuestion.questionText,
        userAnswer,
        isCorrect,
        timeSpent,
        pointsEarned
      );

      // Update algorithm state
      (assessment as any).updateAlgorithmState(isCorrect);

      // Check for level progression
      const progression = (assessment as any).checkLevelProgression();
      if (progression.shouldProgress) {
        const previousLevel = assessment.algorithmState.currentLevel;
        assessment.algorithmState.currentLevel = progression.newLevel;
        assessment.algorithmState.levelHistory.push(progression.newLevel);

        // Reset counters for new level
        if (progression.newLevel !== previousLevel) {
          assessment.algorithmState.correctStreak = 0;
          assessment.algorithmState.wrongStreak = 0;
          assessment.algorithmState.questionsAtCurrentLevel = 0;
          if (progression.reason.includes("High performance")) {
            assessment.algorithmState.highPerformanceStreak = 0;
          }
        }

        logger.info(
          `Student progressed from level ${previousLevel} to ${progression.newLevel}: ${progression.reason}`
        );
      }

      // Check for oscillation
      (assessment as any).detectOscillation();

      // Move to next question
      assessment.currentQuestionIndex++;

      await assessment.save();

      res.json({
        message: "Answer submitted successfully",
        isCorrect,
        pointsEarned,
        currentLevel: assessment.algorithmState.currentLevel,
        progression: progression.shouldProgress
          ? {
              previousLevel:
                assessment.algorithmState.levelHistory[
                  assessment.algorithmState.levelHistory.length - 2
                ],
              newLevel: assessment.algorithmState.currentLevel,
              reason: progression.reason,
            }
          : null,
        progress: {
          totalQuestions: assessment.totalQuestions,
          totalCorrectAnswers: assessment.totalCorrectAnswers,
          accuracy: assessment.accuracy,
        },
      });
    } catch (error) {
      logger.error("Error submitting answer:", error);
      res.status(500).json({
        message: "Error submitting answer",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get assessment results
  static async getAssessmentResults(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const assessment = await ProgramAssessment.findById(assessmentId)
        .populate("student", "name roll_no")
        .populate("program", "name subject")
        .populate("school", "name");

      if (!assessment) {
        res.status(404).json({ message: "Assessment not found" });
        return;
      }

      const results = {
        id: assessment._id,
        status: assessment.status,
        student: assessment.student,
        program: assessment.program,
        school: assessment.school,
        subject: assessment.subject,
        startTime: assessment.startTime,
        endTime: assessment.endTime,
        totalDuration: assessment.totalDuration,
        finalLevel: assessment.finalLevel,
        totalQuestions: assessment.totalQuestions,
        totalCorrectAnswers: assessment.totalCorrectAnswers,
        accuracy: assessment.accuracy,
        averageTimePerQuestion: assessment.averageTimePerQuestion,
        levelAssessments: assessment.levelAssessments,
        algorithmState: {
          finalLevel: assessment.algorithmState.currentLevel,
          levelHistory: assessment.algorithmState.levelHistory,
          oscillationDetected: !!assessment.algorithmState.oscillationPattern,
          stopReason: assessment.algorithmState.stopReason,
        },
        responses: assessment.responses.map((response) => ({
          questionText: response.questionText,
          levelNumber: response.levelNumber,
          userAnswer: response.userAnswer,
          isCorrect: response.isCorrect,
          timeSpent: response.timeSpent,
          pointsEarned: response.pointsEarned,
          timestamp: response.timestamp,
        })),
      };

      res.json(results);
    } catch (error) {
      logger.error("Error getting assessment results:", error);
      res.status(500).json({
        message: "Error retrieving results",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get all assessments for a student
  static async getStudentAssessments(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { studentId } = req.params;
      const { status, programId } = req.query;

      const filter: any = { student: studentId };

      if (status) {
        filter.status = status;
      }

      if (programId) {
        filter.program = programId;
      }

      const assessments = await ProgramAssessment.find(filter)
        .populate("program", "name subject")
        .populate("school", "name")
        .sort({ createdAt: -1 });

      const results = assessments.map((assessment) => ({
        id: assessment._id,
        status: assessment.status,
        program: assessment.program,
        school: assessment.school,
        subject: assessment.subject,
        startTime: assessment.startTime,
        endTime: assessment.endTime,
        finalLevel: assessment.finalLevel,
        totalQuestions: assessment.totalQuestions,
        accuracy: assessment.accuracy,
        createdAt: assessment.createdAt,
      }));

      res.json(results);
    } catch (error) {
      logger.error("Error getting student assessments:", error);
      res.status(500).json({
        message: "Error retrieving assessments",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Abandon/cancel an assessment
  static async abandonAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;

      const assessment = await ProgramAssessment.findById(assessmentId);
      if (!assessment) {
        res.status(404).json({ message: "Assessment not found" });
        return;
      }

      if (assessment.status !== AssessmentStatus.IN_PROGRESS) {
        res.status(400).json({
          message: "Assessment is not in progress",
          status: assessment.status,
        });
        return;
      }

      assessment.status = AssessmentStatus.ABANDONED;
      assessment.endTime = new Date();
      assessment.totalDuration = Math.floor(
        (assessment.endTime.getTime() - assessment.startTime.getTime()) / 1000
      );
      assessment.algorithmState.stopReason = "Assessment abandoned by user";

      await assessment.save();

      logger.info(`Assessment ${assessmentId} abandoned`);

      res.json({
        message: "Assessment abandoned successfully",
        finalResults: {
          status: assessment.status,
          totalQuestions: assessment.totalQuestions,
          totalCorrectAnswers: assessment.totalCorrectAnswers,
          accuracy: assessment.accuracy,
          duration: assessment.totalDuration,
        },
      });
    } catch (error) {
      logger.error("Error abandoning assessment:", error);
      res.status(500).json({
        message: "Error abandoning assessment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get assessment statistics (for analytics)
  static async getAssessmentStatistics(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { programId, schoolId, timeRange } = req.query;

      const filter: any = {};

      if (programId) {
        filter.program = programId;
      }

      if (schoolId) {
        filter.school = schoolId;
      }

      if (timeRange) {
        const days = parseInt(timeRange as string);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        filter.createdAt = { $gte: startDate };
      }

      const assessments = await ProgramAssessment.find(filter);

      const statistics = {
        totalAssessments: assessments.length,
        completedAssessments: assessments.filter(
          (a) => a.status === AssessmentStatus.COMPLETED
        ).length,
        abandonedAssessments: assessments.filter(
          (a) => a.status === AssessmentStatus.ABANDONED
        ).length,
        inProgressAssessments: assessments.filter(
          (a) => a.status === AssessmentStatus.IN_PROGRESS
        ).length,
        averageAccuracy:
          assessments.reduce((sum, a) => sum + a.accuracy, 0) /
            assessments.length || 0,
        averageDuration:
          assessments.reduce((sum, a) => sum + a.totalDuration, 0) /
            assessments.length || 0,
        averageFinalLevel:
          assessments.reduce((sum, a) => sum + a.finalLevel, 0) /
            assessments.length || 0,
        levelDistribution: {},
        accuracyDistribution: {
          low: assessments.filter((a) => a.accuracy < 50).length,
          medium: assessments.filter((a) => a.accuracy >= 50 && a.accuracy < 80)
            .length,
          high: assessments.filter((a) => a.accuracy >= 80).length,
        },
      };

      // Calculate level distribution
      for (let level = 0; level <= 10; level++) {
        (statistics.levelDistribution as any)[level] = assessments.filter(
          (a) => a.finalLevel === level
        ).length;
      }

      res.json(statistics);
    } catch (error) {
      logger.error("Error getting assessment statistics:", error);
      res.status(500).json({
        message: "Error retrieving statistics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
