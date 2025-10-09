import { Router } from "express";
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  toggleProgramStatus,
  getProgramTimeLapseMatrix,
  getTimeToComplete,
  getLevelDetails,
  createSampleHindiProgram,
  validateLevelProgression,
} from "../controllers/programController";
import { importProgram } from "../controllers/programImportController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Public routes (accessible by all authenticated users)
/**
 * @route   GET /api/programs
 * @desc    Get all programs with filtering and pagination
 * @access  Private (All authenticated users)
 * @query   {string} subject - Filter by subject (any string value)
 * @query   {string} isActive - Filter by active status (true/false) [default: true]
 * @query   {string} includeInactive - Include inactive programs (true/false) [default: false]
 * @query   {string} page - Page number [default: 1]
 * @query   {string} limit - Items per page [default: 10]
 */
router.get("/", getPrograms);

/**
 * @route   GET /api/programs/:id
 * @desc    Get program by ID
 * @access  Private (All authenticated users)
 * @param   {string} id - Program ObjectId
 */
router.get("/:id", getProgramById);

/**
 * @route   GET /api/programs/:id/time-lapse-matrix
 * @desc    Get time lapse matrix for the program
 * @access  Private (All authenticated users)
 * @param   {string} id - Program ObjectId
 * @query   {string} unit - Time unit (days, weeks, months) [default: weeks]
 */
router.get("/:id/time-lapse-matrix", getProgramTimeLapseMatrix);

/**
 * @route   GET /api/programs/:id/time-to-complete
 * @desc    Get time to complete between specific levels
 * @access  Private (All authenticated users)
 * @param   {string} id - Program ObjectId
 * @query   {string} fromLevel - Starting level [default: 1]
 * @query   {string} toLevel - Ending level [default: last level]
 * @query   {string} unit - Time unit (days, weeks, months) [default: weeks]
 */
router.get("/:id/time-to-complete", getTimeToComplete);

/**
 * @route   GET /api/programs/:id/levels/:levelNumber
 * @desc    Get details for a specific level
 * @access  Private (All authenticated users)
 * @param   {string} id - Program ObjectId
 * @param   {string} levelNumber - Level number
 */
router.get("/:id/levels/:levelNumber", getLevelDetails);

/**
 * @route   POST /api/programs/:id/validate-progression
 * @desc    Validate if progression from one level to another is allowed
 * @access  Private (All authenticated users)
 * @param   {string} id - Program ObjectId
 * @body    {number} fromLevel - Starting level
 * @body    {number} toLevel - Target level
 */
router.post("/:id/validate-progression", validateLevelProgression);

// Admin routes (SCHOOL_ADMIN, SUPER_ADMIN)
/**
 * @route   POST /api/programs
 * @desc    Create a new program
 * @access  Private (SCHOOL_ADMIN, SUPER_ADMIN)
 * @body    {string} name - Program name
 * @body    {string} subject - Program subject (any string value)
 * @body    {string} description - Program description [optional]
 * @body    {number} totalLevels - Total number of levels
 * @body    {Array} levels - Array of level objects
 */
router.post(
  "/",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  createProgram
);

/**
 * @route   PUT /api/programs/:id
 * @desc    Update program
 * @access  Private (Program creator or SUPER_ADMIN)
 * @param   {string} id - Program ObjectId
 * @body    Updates to apply
 */
router.put(
  "/:id",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  updateProgram
);

/**
 * @route   DELETE /api/programs/:id
 * @desc    Delete program
 * @access  Private (Program creator or SUPER_ADMIN)
 * @param   {string} id - Program ObjectId
 */
router.delete(
  "/:id",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  deleteProgram
);

/**
 * @route   PATCH /api/programs/:id/toggle-status
 * @desc    Toggle program active/inactive status
 * @access  Private (Program creator or SUPER_ADMIN)
 * @param   {string} id - Program ObjectId
 */
router.patch(
  "/:id/toggle-status",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  toggleProgramStatus
);

// Super Admin only routes
/**
 * @route   POST /api/programs/samples/hindi
 * @desc    Create sample Hindi program with 10 levels
 * @access  Private (SUPER_ADMIN only)
 */
router.post(
  "/samples/hindi",
  roleMiddleware(UserRole.SUPER_ADMIN),
  createSampleHindiProgram
);

/**
 * @route   POST /api/programs/import
 * @desc    Import program from JSON file
 * @access  Private (SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.post(
  "/import",
  roleMiddleware(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN),
  importProgram
);

export default router;
