import express from "express";
import {
  generateAnalyticsDashboard,
  getAnalyticsDashboard,
  getAnalyticsDashboards,
  getRealTimeAnalytics,
  getPerformanceInsights,
  getPredictiveAnalytics,
  exportAnalyticsData,
  getKPITrends,
  updateAnalyticsDashboard,
  deleteAnalyticsDashboard,
} from "../controllers/analyticsController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   POST /analytics/dashboard
 * @desc    Generate a new analytics dashboard
 * @access  School Admin, Super Admin
 */
router.post(
  "/dashboard",
  roleMiddleware("school_admin", "super_admin"),
  generateAnalyticsDashboard
);

/**
 * @route   GET /analytics/dashboards
 * @desc    Get all analytics dashboards with filtering
 * @access  School Admin, Super Admin, Mentor (limited)
 */
router.get(
  "/dashboards",
  roleMiddleware("school_admin", "super_admin", "mentor"),
  getAnalyticsDashboards
);

/**
 * @route   GET /analytics/dashboard/:id
 * @desc    Get analytics dashboard by ID
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/dashboard/:id",
  roleMiddleware("school_admin", "super_admin", "mentor"),
  getAnalyticsDashboard
);

/**
 * @route   PUT /analytics/dashboard/:id
 * @desc    Update analytics dashboard
 * @access  School Admin, Super Admin
 */
router.put(
  "/dashboard/:id",
  roleMiddleware("school_admin", "super_admin"),
  updateAnalyticsDashboard
);

/**
 * @route   DELETE /analytics/dashboard/:id
 * @desc    Delete analytics dashboard
 * @access  Super Admin, Dashboard Creator
 */
router.delete(
  "/dashboard/:id",
  roleMiddleware("school_admin", "super_admin"),
  deleteAnalyticsDashboard
);

/**
 * @route   GET /analytics/realtime
 * @desc    Get real-time analytics data
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/realtime",
  roleMiddleware("school_admin", "super_admin", "mentor"),
  getRealTimeAnalytics
);

/**
 * @route   GET /analytics/performance-insights
 * @desc    Get performance insights and recommendations
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/performance-insights",
  roleMiddleware("school_admin", "super_admin", "mentor"),
  getPerformanceInsights
);

/**
 * @route   GET /analytics/predictive
 * @desc    Get predictive analytics and forecasts
 * @access  School Admin, Super Admin
 */
router.get(
  "/predictive",
  roleMiddleware("school_admin", "super_admin"),
  getPredictiveAnalytics
);

/**
 * @route   GET /analytics/kpi-trends
 * @desc    Get KPI trends and historical data
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/kpi-trends",
  roleMiddleware("school_admin", "super_admin", "mentor"),
  getKPITrends
);

/**
 * @route   GET /analytics/export/:id
 * @desc    Export analytics dashboard data
 * @access  School Admin, Super Admin
 * @query   format - Export format: 'json', 'csv', 'pdf'
 */
router.get(
  "/export/:id",
  roleMiddleware("school_admin", "super_admin"),
  exportAnalyticsData
);

export default router;
