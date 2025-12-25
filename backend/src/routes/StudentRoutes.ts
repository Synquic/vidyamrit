import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../configs/roles";
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentLevel,
  getStudentCohortStatus,
  getArchivedStudents,
  restoreStudent,
  getStudentComprehensiveReport,
} from "../controllers/studentController";

const studentRouter = Router();

// Students are database records, no auth required for them
studentRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER),
  createStudent
); // Create a student record
studentRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER),
  getStudents
); // Get all students (with optional schoolId filter)
studentRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER),
  getStudent
); // Get a single student by MongoDB _id
studentRouter.get(
  "/:id/level",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER),
  getStudentLevel
); // Get student's current level
studentRouter.get(
  "/:id/comprehensive-report",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR, UserRole.VOLUNTEER),
  getStudentComprehensiveReport
); // Get comprehensive report for a student
studentRouter.get(
  "/cohort-status/:schoolId",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getStudentCohortStatus
); // Get cohort assignment status for a school
studentRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  updateStudent
); // Update student by MongoDB _id
studentRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  deleteStudent
); // Archive student (soft delete)
studentRouter.get(
  "/archived/all",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  getArchivedStudents
); // Get all archived students
studentRouter.post(
  "/:id/restore",
  authMiddleware,
  roleMiddleware(UserRole.SUPER_ADMIN, UserRole.TUTOR),
  restoreStudent
); // Restore archived student

export default studentRouter;
