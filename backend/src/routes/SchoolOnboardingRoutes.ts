import express from "express";
import {
  createSchoolOnboarding,
  getSchoolOnboardings,
  getSchoolOnboardingById,
  updateSchoolOnboarding,
  addOnboardingTask,
  updateTaskProgress,
  completeOnboardingTask,
  addOnboardingMilestone,
  completeMilestone,
  scheduleTrainingSession,
  updateTrainingAttendance,
  createSupportTicket,
  updateSupportTicket,
  addSchoolFeedback,
  getOnboardingStatistics,
  generateOnboardingReport,
  getBlockedTasks,
  getUpcomingDeadlines,
  deleteSchoolOnboarding,
} from "../controllers/schoolOnboardingController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Public routes (authenticated users)
router.get("/statistics", getOnboardingStatistics);

// Create school onboarding (Super Admin only)
router.post("/", roleMiddleware(["super_admin"]), createSchoolOnboarding);

// Get all school onboardings (with role-based filtering)
router.get("/", getSchoolOnboardings);

// Get specific school onboarding by ID
router.get("/:id", getSchoolOnboardingById);

// Update school onboarding (Project team members and Super Admin)
router.put("/:id", updateSchoolOnboarding);

// Task management
router.post("/:id/tasks", addOnboardingTask);
router.put("/:id/tasks/:taskId/progress", updateTaskProgress);
router.put("/:id/tasks/:taskId/complete", completeOnboardingTask);

// Milestone management
router.post("/:id/milestones", addOnboardingMilestone);
router.put("/:id/milestones/:milestoneId/complete", completeMilestone);

// Training session management
router.post("/:id/training-sessions", scheduleTrainingSession);
router.put(
  "/:id/training-sessions/:sessionId/attendance",
  updateTrainingAttendance
);

// Support ticket management
router.post("/:id/support-tickets", createSupportTicket);
router.put("/:id/support-tickets/:ticketId", updateSupportTicket);

// School feedback
router.post("/:id/feedback", addSchoolFeedback);

// Reports and analytics
router.get("/:id/report", generateOnboardingReport);
router.get("/:id/blocked-tasks", getBlockedTasks);
router.get("/:id/upcoming-deadlines", getUpcomingDeadlines);

// Delete school onboarding (Super Admin only)
router.delete("/:id", roleMiddleware(["super_admin"]), deleteSchoolOnboarding);

export default router;
