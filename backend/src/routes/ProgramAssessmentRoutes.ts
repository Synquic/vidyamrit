import express from "express";
import { ProgramAssessmentController } from "../controllers/programAssessmentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/program-assessments
 * @desc Create a new program-based assessment
 * @access Private (Tutor, Super Admin)
 * @body {
 *   studentId: string,
 *   schoolId: string,
 *   programId: string,
 *   config?: {
 *     randomizeQuestions?: boolean,
 *     maxQuestionsPerLevel?: number,
 *     oscillationTolerance?: number,
 *     minQuestionsBeforeOscillationStop?: number
 *   }
 * }
 */
router.post(
  "/",
  roleMiddleware(UserRole.TUTOR, UserRole.SUPER_ADMIN),
  ProgramAssessmentController.createAssessment
);

/**
 * @route GET /api/program-assessments/:assessmentId/current-question
 * @desc Get the current question for an active assessment
 * @access Private (Tutor, Super Admin)
 * @returns {
 *   hasNextQuestion: boolean,
 *   question?: {
 *     id: string,
 *     text: string,
 *     type: string,
 *     options?: string[],
 *     levelNumber: number,
 *     points: number
 *   },
 *   currentLevel: number,
 *   progress: {
 *     totalQuestions: number,
 *     currentQuestionIndex: number,
 *     accuracy: number
 *   },
 *   shouldStop?: boolean,
 *   stopReason?: string
 * }
 */
router.get(
  "/:assessmentId/current-question",
  roleMiddleware(UserRole.TUTOR, UserRole.SUPER_ADMIN),
  ProgramAssessmentController.getCurrentQuestion
);

/**
 * @route POST /api/program-assessments/submit-answer
 * @desc Submit an answer for the current question
 * @access Private (Tutor, Super Admin)
 * @body {
 *   assessmentId: string,
 *   questionId: string,
 *   userAnswer: string | boolean | number,
 *   timeSpent: number
 * }
 * @returns {
 *   message: string,
 *   isCorrect: boolean,
 *   pointsEarned: number,
 *   currentLevel: number,
 *   progression?: {
 *     previousLevel: number,
 *     newLevel: number,
 *     reason: string
 *   },
 *   progress: {
 *     totalQuestions: number,
 *     totalCorrectAnswers: number,
 *     accuracy: number
 *   }
 * }
 */
router.post(
  "/submit-answer",
  roleMiddleware(UserRole.TUTOR, UserRole.SUPER_ADMIN),
  ProgramAssessmentController.submitAnswer
);

/**
 * @route GET /api/program-assessments/:assessmentId/results
 * @desc Get detailed results for a completed or in-progress assessment
 * @access Private (Tutor, Super Admin)
 * @returns Complete assessment results with responses, level assessments, and algorithm state
 */
router.get(
  "/:assessmentId/results",
  roleMiddleware(UserRole.TUTOR, UserRole.SUPER_ADMIN),
  ProgramAssessmentController.getAssessmentResults
);

/**
 * @route GET /api/program-assessments/student/:studentId
 * @desc Get all assessments for a specific student
 * @access Private (Tutor, Super Admin)
 * @query {
 *   status?: string, // Filter by assessment status
 *   programId?: string // Filter by specific program
 * }
 * @returns Array of assessment summaries for the student
 */
router.get(
  "/student/:studentId",
  roleMiddleware(UserRole.TUTOR, UserRole.SUPER_ADMIN),
  ProgramAssessmentController.getStudentAssessments
);

/**
 * @route PUT /api/program-assessments/:assessmentId/abandon
 * @desc Abandon/cancel an in-progress assessment
 * @access Private (Tutor, Super Admin)
 * @returns Final results summary
 */
router.put(
  "/:assessmentId/abandon",
  roleMiddleware(UserRole.TUTOR, UserRole.SUPER_ADMIN),
  ProgramAssessmentController.abandonAssessment
);

/**
 * @route GET /api/program-assessments/statistics
 * @desc Get assessment statistics for analytics
 * @access Private (Super Admin only)
 * @query {
 *   programId?: string, // Filter by specific program
 *   schoolId?: string, // Filter by specific school
 *   timeRange?: number // Number of days to look back
 * }
 * @returns Statistical analysis of assessments
 */
router.get(
  "/statistics",
  roleMiddleware(UserRole.SUPER_ADMIN),
  ProgramAssessmentController.getAssessmentStatistics
);

export default router;
