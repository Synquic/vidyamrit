import { Router } from "express";
import {
  getDashboardAnalytics,
  getSchoolAnalytics,
  getPerformanceTrends
} from "../controllers/analyticsController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard analytics
 * @access  All authenticated users
 */
router.get(
  "/dashboard",
  getDashboardAnalytics
);

/**
 * @route   GET /api/analytics/school/:schoolId
 * @desc    Get school-specific analytics
 * @access  Admin, Super Admin
 */
router.get(
  "/school/:schoolId",
  roleMiddleware(["admin", "super_admin"]),
  getSchoolAnalytics
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get performance trends over time
 * @access  All authenticated users
 */
router.get(
  "/trends",
  getPerformanceTrends
);

export default router;
