import { Router } from "express";
import {
  processLevelTransitions,
  getStudentTransitionRecommendation,
  manualLevelTransition,
} from "../controllers/levelTransitionController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const levelTransitionRouter = Router();

// Process automatic level transitions for a cohort
levelTransitionRouter.post(
  "/cohort/:cohortId/process",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  processLevelTransitions
);

// Get transition recommendation for a specific student
levelTransitionRouter.get(
  "/cohort/:cohortId/student/:studentId/recommendation",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudentTransitionRecommendation
);

// Apply manual level transition
levelTransitionRouter.post(
  "/manual",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  manualLevelTransition
);

export default levelTransitionRouter;