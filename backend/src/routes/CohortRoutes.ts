import { Router } from "express";
import {
  getCohorts,
  getCohort,
  createCohort,
  updateCohort,
  deleteCohort,
  addStudentToCohort,
  addStudentToDefaultCohort,
  generateOptimalCohorts,
  checkAssessmentReadiness,
  toggleCohortHoliday,
} from "../controllers/cohortController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const cohortRouter = Router();

cohortRouter.use(authMiddleware);

// Get all cohorts
cohortRouter.get(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getCohorts
);

// Get single cohort
cohortRouter.get(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getCohort
);

// Create cohort
cohortRouter.post("/", roleMiddleware(UserRole.SUPER_ADMIN), createCohort);

// Update cohort
cohortRouter.put("/:id", roleMiddleware(UserRole.SUPER_ADMIN), updateCohort);

// Delete cohort
cohortRouter.delete("/:id", roleMiddleware(UserRole.SUPER_ADMIN), deleteCohort);

// Tutor can add students to cohort
cohortRouter.post(
  "/:id/add-student",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  addStudentToCohort
);

// Add student to default cohort (used after assessment)
cohortRouter.post(
  "/add-to-default",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  addStudentToDefaultCohort
);

// Generate optimal cohorts using algorithm
cohortRouter.post(
  "/generate-optimal",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  generateOptimalCohorts
);

// Check if cohort is ready for level-up assessment
cohortRouter.get(
  "/:id/assessment-readiness",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  checkAssessmentReadiness
);

// Mark/unmark a date as holiday for a cohort
cohortRouter.post(
  "/:id/toggle-holiday",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  toggleCohortHoliday
);

export default cohortRouter;
