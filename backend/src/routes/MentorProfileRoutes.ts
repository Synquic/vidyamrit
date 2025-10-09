import express from "express";
import {
  createMentorProfile,
  getMentorProfiles,
  getMentorProfileById,
  updateMentorProfile,
  addPerformanceMetric,
  assignToMentor,
  updateAssignment,
  addFeedback,
  getMentorStatistics,
} from "../controllers/mentorProfileController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get mentor statistics
router.get("/statistics", getMentorStatistics);

// Get all mentor profiles (with filters and pagination)
router.get("/", getMentorProfiles);

// Get specific mentor profile by ID
router.get("/:id", getMentorProfileById);

// Create new mentor profile - School Admin and Super Admin only
router.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  createMentorProfile
);

// Update mentor profile - Mentor can update own, admins can update any
router.put("/:id", updateMentorProfile);

// Add performance metric - School Admin and Super Admin only
router.post(
  "/:id/performance",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  addPerformanceMetric
);

// Assign student/group/cohort to mentor - School Admin and Super Admin only
router.post(
  "/:id/assignments",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  assignToMentor
);

// Update assignment - School Admin, Super Admin, and the assigned Mentor
router.put("/:id/assignments/:assignmentId", updateAssignment);

// Add feedback for mentor
router.post("/:id/feedback", addFeedback);

export default router;
