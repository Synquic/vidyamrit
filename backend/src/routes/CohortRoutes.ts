import { Router } from "express";
import {
  getCohorts,
  getCohort,
  createCohort,
  updateCohort,
  deleteCohort,
  addStudentToCohort,
  addStudentToDefaultCohort,
} from "../controllers/cohortController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const cohortRouter = Router();

cohortRouter.use(authMiddleware);

// Get all cohorts
cohortRouter.get(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  getCohorts
);

// Get single cohort
cohortRouter.get(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  getCohort
);

// Create cohort
cohortRouter.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  createCohort
);

// Update cohort
cohortRouter.put(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  updateCohort
);

// Delete cohort
cohortRouter.delete(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  deleteCohort
);

// Mentor can add students to cohort
cohortRouter.post(
  "/:id/add-student",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  addStudentToCohort
);

// Add student to default cohort (used after assessment)
cohortRouter.post(
  "/add-to-default",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  addStudentToDefaultCohort
);

export default cohortRouter;
