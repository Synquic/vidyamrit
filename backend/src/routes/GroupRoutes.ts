import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  autoAssignStudentsToGroups,
  getGroupStatistics,
} from "../controllers/groupController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get all groups (with filters)
router.get("/", getGroups);

// Get group statistics
router.get("/statistics", getGroupStatistics);

// Get specific group by ID
router.get("/:id", getGroupById);

// Create new group - School Admin and Super Admin only
router.post(
  "/",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  createGroup
);

// Update group - School Admin and Super Admin only
router.put(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  updateGroup
);

// Delete group - School Admin and Super Admin only
router.delete(
  "/:id",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  deleteGroup
);

// Add student to group - School Admin, Super Admin, and Mentors only
router.post(
  "/:id/students",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  addStudentToGroup
);

// Remove student from group - School Admin, Super Admin, and Mentors only
router.delete(
  "/:id/students/:studentId",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR),
  removeStudentFromGroup
);

// Auto-assign students to groups - School Admin and Super Admin only
router.post(
  "/auto-assign",
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN),
  autoAssignStudentsToGroups
);

export default router;
