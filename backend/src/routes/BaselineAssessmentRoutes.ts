import { Router } from "express";
import {
  scheduleBaselineAssessment,
  conductBaselineAssessment,
  getAssessmentQuestions,
  getStudentAssessmentHistory,
} from "../controllers/baselineAssessmentController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const baselineAssessmentRouter = Router();

// Schedule baseline assessment for students ready for level transition
baselineAssessmentRouter.get(
  "/cohort/:cohortId/ready",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  scheduleBaselineAssessment
);

// Conduct baseline assessment for a student
baselineAssessmentRouter.post(
  "/conduct",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  conductBaselineAssessment
);

// Get assessment questions for a specific level
baselineAssessmentRouter.get(
  "/program/:programId/level/:levelNumber/questions",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getAssessmentQuestions
);

// Get assessment history for a student
baselineAssessmentRouter.get(
  "/cohort/:cohortId/student/:studentId/history",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudentAssessmentHistory
);

export default baselineAssessmentRouter;