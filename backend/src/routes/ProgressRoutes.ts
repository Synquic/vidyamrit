import express from "express";
import {
  updateProgressFlag,
  getStudentProgress,
  getProgressStatistics,
  bulkUpdateProgressFlags,
  getProgressTrends,
} from "../controllers/progressController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get progress statistics - accessible to all authenticated users
router.get("/statistics", getProgressStatistics);

// Get student progress trends
router.get("/trends", getProgressTrends);

// Get specific student progress
router.get("/student/:studentId", getStudentProgress);

// Update single student progress flag - School Admin, Super Admin, and Mentors only
router.put(
  "/student/:studentId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  updateProgressFlag
);

// Bulk update progress flags - School Admin and Super Admin only
router.post(
  "/bulk-update",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  bulkUpdateProgressFlags
);

export default router;
