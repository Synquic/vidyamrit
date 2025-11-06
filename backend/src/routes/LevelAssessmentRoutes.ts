import { Router } from "express";
import {
  getLevelAssessmentQuestions,
  conductLevelAssessment,
} from "../controllers/levelAssessmentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const levelAssessmentRouter = Router();

levelAssessmentRouter.use(authMiddleware);

// Get level-specific assessment questions for a cohort's current level
levelAssessmentRouter.get(
  "/cohort/:cohortId/questions",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getLevelAssessmentQuestions
);

// Conduct level-specific assessment for a student
levelAssessmentRouter.post(
  "/conduct",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  conductLevelAssessment
);

export default levelAssessmentRouter;

