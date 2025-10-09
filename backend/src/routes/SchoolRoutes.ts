import { Router } from "express";
import {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
} from "../controllers/schoolController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const schoolRouter = Router();

// Get all schools
schoolRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getSchools
);

// Get single school
schoolRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getSchoolById
);

// Create school
schoolRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN),
  createSchool
);

// Update school
schoolRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN),
  updateSchool
);

// Delete school
schoolRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN),
  deleteSchool
);

export default schoolRouter;
