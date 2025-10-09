import express from "express";
import {
  createEnhancedStudentProfile,
  getEnhancedStudentProfiles,
  getEnhancedStudentProfileById,
  updateEnhancedStudentProfile,
  addAcademicRecord,
  addAssessmentRecord,
  addBehavioralRecord,
  addCommunicationLog,
  addExtracurricularActivity,
  addIntervention,
  updateInterventionProgress,
  updateAcademicGoals,
  updatePerformanceMetrics,
  getStudentStatistics,
  generateStudentReport,
  getUpcomingGoals,
  getAttendanceOverview,
  getBehavioralSummary,
  deleteEnhancedStudentProfile,
} from "../controllers/enhancedStudentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * @route   POST /enhanced-students
 * @desc    Create a new enhanced student profile
 * @access  School Admin, Super Admin
 */
router.post(
  "/",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  createEnhancedStudentProfile
);

/**
 * @route   GET /enhanced-students
 * @desc    Get enhanced student profiles with filtering and pagination
 * @access  School Admin, Super Admin, Mentor (limited)
 */
router.get(
  "/",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  getEnhancedStudentProfiles
);

/**
 * @route   GET /enhanced-students/statistics
 * @desc    Get student statistics and analytics
 * @access  School Admin, Super Admin
 */
router.get(
  "/statistics",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  getStudentStatistics
);

/**
 * @route   GET /enhanced-students/:id
 * @desc    Get enhanced student profile by ID
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/:id",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  getEnhancedStudentProfileById
);

/**
 * @route   PUT /enhanced-students/:id
 * @desc    Update enhanced student profile
 * @access  School Admin, Super Admin
 */
router.put(
  "/:id",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  updateEnhancedStudentProfile
);

/**
 * @route   DELETE /enhanced-students/:id
 * @desc    Delete enhanced student profile
 * @access  Super Admin only
 */
router.delete(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN),
  deleteEnhancedStudentProfile
);

// Academic Records Management
/**
 * @route   POST /enhanced-students/:id/academic-records
 * @desc    Add academic record to student profile
 * @access  School Admin, Super Admin, Mentor
 */
router.post(
  "/:id/academic-records",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  addAcademicRecord
);

// Assessment Management
/**
 * @route   POST /enhanced-students/:id/assessments
 * @desc    Add assessment record to student profile
 * @access  School Admin, Super Admin, Mentor
 */
router.post(
  "/:id/assessments",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  addAssessmentRecord
);

// Behavioral Records Management
/**
 * @route   POST /enhanced-students/:id/behavioral-records
 * @desc    Add behavioral record to student profile
 * @access  School Admin, Super Admin, Mentor
 */
router.post(
  "/:id/behavioral-records",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  addBehavioralRecord
);

/**
 * @route   GET /enhanced-students/:id/behavioral-summary
 * @desc    Get behavioral summary for a student
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/:id/behavioral-summary",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  getBehavioralSummary
);

// Communication Management
/**
 * @route   POST /enhanced-students/:id/communication-logs
 * @desc    Add communication log to student profile
 * @access  School Admin, Super Admin, Mentor
 */
router.post(
  "/:id/communication-logs",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  addCommunicationLog
);

// Extracurricular Activities Management
/**
 * @route   POST /enhanced-students/:id/extracurricular-activities
 * @desc    Add extracurricular activity to student profile
 * @access  School Admin, Super Admin, Mentor
 */
router.post(
  "/:id/extracurricular-activities",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  addExtracurricularActivity
);

// Intervention Management
/**
 * @route   POST /enhanced-students/:id/interventions
 * @desc    Add intervention to student profile
 * @access  School Admin, Super Admin, Mentor
 */
router.post(
  "/:id/interventions",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  addIntervention
);

/**
 * @route   PUT /enhanced-students/:id/interventions/:interventionId/progress
 * @desc    Update intervention progress
 * @access  School Admin, Super Admin, Mentor
 */
router.put(
  "/:id/interventions/:interventionId/progress",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  updateInterventionProgress
);

// Goals Management
/**
 * @route   PUT /enhanced-students/:id/academic-goals
 * @desc    Update academic goals for student
 * @access  School Admin, Super Admin, Mentor
 */
router.put(
  "/:id/academic-goals",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  updateAcademicGoals
);

/**
 * @route   GET /enhanced-students/:id/upcoming-goals
 * @desc    Get upcoming goals for student
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/:id/upcoming-goals",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  getUpcomingGoals
);

// Performance and Analytics
/**
 * @route   PUT /enhanced-students/:id/performance-metrics
 * @desc    Update performance metrics for student
 * @access  School Admin, Super Admin
 */
router.put(
  "/:id/performance-metrics",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  updatePerformanceMetrics
);

/**
 * @route   GET /enhanced-students/:id/attendance-overview
 * @desc    Get attendance overview for student
 * @access  School Admin, Super Admin, Mentor
 */
router.get(
  "/:id/attendance-overview",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  getAttendanceOverview
);

// Reporting
/**
 * @route   GET /enhanced-students/:id/report
 * @desc    Generate comprehensive student report
 * @access  School Admin, Super Admin, Mentor
 * @query   type - Report type: 'comprehensive', 'academic', 'behavioral'
 */
router.get(
  "/:id/report",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.MENTOR),
  generateStudentReport
);

export default router;
