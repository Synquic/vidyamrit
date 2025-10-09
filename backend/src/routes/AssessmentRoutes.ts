import { Router } from "express";
import {
  getAssessments,
  getAssessment,
  createAssessment,
} from "../controllers/assessmentController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const assessmentRouter = Router();

// Get all assessments
assessmentRouter.get(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getAssessments
);

// Get single assessment
assessmentRouter.get(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getAssessment
);

// Create assessment
assessmentRouter.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  createAssessment
);

export default assessmentRouter;
